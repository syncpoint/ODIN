import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import './Feature'
import { corridorGeometry } from './corridor-geometry'
import { polyEditor } from './poly-editor'
import { FULCRUM } from './handle-types'

/**
 *
 */
export const widthEditor = (corridor, layer, events) => {

  let current = corridor

  const width = handle => {
    const distance = handle.getLatLng().distanceTo(current.latlngs[0])
    return distance * 2
  }

  const update = (latlngs, width = current.width) => {
    current = corridorGeometry(latlngs, width)
    const tip = current.envelope()[0]
    A1.setLatLng(tip[0])
    A2.setLatLng(tip[1])
    return current
  }

  const handleOptions = {
    type: FULCRUM,
    drag: ({ target }) => events('drag', update(current.latlngs, width(target))),
    dragend: ({ target }) => events('dragend', update(current.latlngs, width(target)))
  }

  const tip = current.envelope()[0]
  const A1 = layer.addHandle(tip[0], handleOptions)
  const A2 = layer.addHandle(tip[1], handleOptions)

  return update
}


/**
 * Abstract corridor.
 * Define the follow to subclass:
 * - _shape()
 */
L.TACGRP.Corridor = L.TACGRP.Feature.extend({

  lineSmoothing: false,

  /**
   * Project WGS84 geometry to pixel/layer coordinates.
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    this._frame = {
      center: this._geometry.latlngs.map(layerPoint),
      envelope: this._geometry.envelope().map(pair => pair.map(layerPoint))
    }
  },

  _geometryEditor () {
    const layer = new L.Handles().addTo(this._map)

    const callback = (channel, corridor) => {
      this._geometry = corridor
      this._reset()

      if (channel === 'dragend') {
        const geometry = toGeometry('LineString', corridor.latlngs.slice().reverse())
        this.options.update({ geometry, properties: { geometry_width: corridor.width } })
      }
    }

    // Downstream editor: polyline + width
    const width = widthEditor(this._geometry, layer, (channel, corridor) => {
      this._geometry = corridor
      callback(channel, this._geometry)
    })

    const options = {
      closed: false,
      midways: ('midways' in this) ? this.midways : true
    }

    // Upstream editor: polyline only
    polyEditor(this._geometry.latlngs, layer, options)((channel, latlngs) => {
      this._geometry = corridorGeometry(latlngs, this._geometry.width)
      width(latlngs)
      callback(channel, this._geometry)
    })

    return {
      dispose: () => this._map.removeLayer(layer)
    }
  },


  /**
   *
   */
  _setFeature (feature) {
    // Change direction internally:
    const latlngs = toLatLngs(feature.geometry).slice().reverse()
    const width = feature.properties.geometry_width
    this._geometry = corridorGeometry(latlngs, width)

    this._shapeOptions = {
      interactive: this.options.interactive,
      labels: this._labels(),
      styles: this._styles(feature)
    }
  }
})

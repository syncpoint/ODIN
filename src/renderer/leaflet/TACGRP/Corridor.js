import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import './Feature'
import { corridorGeometry } from './corridor-geometry'
import { doublyLinkedList } from '../../../shared/lists'
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

  /**
   * Project WGS84 geometry to pixel/layer coordinates.
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    this._shape.updateFrame({
      center: this._corridor.latlngs.map(layerPoint),
      envelope: this._corridor.envelope().map(pair => pair.map(layerPoint))
    })
  },

  _editor () {
    const layer = new L.Feature.Handles().addTo(this._map)
    let current = this._corridor

    const callback = (channel, corridor) => {
      switch (channel) {
        case 'drag': {
          this._corridor = corridor
          return this._project()
        }
        case 'drage nd': {
          // NOTE: We change direction again on save:
          const geometry = toGeometry('LineString', corridor.latlngs.slice().reverse())
          return this.options.update({ geometry, properties: { geometry_width: corridor.width } })
        }
      }
    }

    // Downstream editor: polyline + width
    const width = widthEditor(current, layer, (channel, corridor) => {
      current = corridor
      callback(channel, current)
    })

    // TODO: Provide options for 2-pt lines
    // Upstream editor: polyline only
    polyEditor(current.latlngs, layer, doublyLinkedList(), (channel, latlngs) => {
      current = corridorGeometry(latlngs, current.width)
      width(latlngs)
      callback(channel, current)
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
    this._corridor = corridorGeometry(latlngs, width)

    this._shapeOptions = {
      interactive: this.options.interactive,
      labels: this._labels(),
      styles: this._styles(feature)
    }
  }
})

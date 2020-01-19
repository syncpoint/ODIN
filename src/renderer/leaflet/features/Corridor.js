import L from 'leaflet'
import * as R from 'ramda'
import { toLatLngs, toGeometry } from '../GeoJSON'
import './Feature'
import { corridorGeometry } from './corridor-geometry'
import { polyEditor } from './poly-editor'
import { styles } from '../features/styles'
import { FULCRUM } from './handle-types'

/**
 *
 */
export const widthEditor = (corridor, layer, options) => events => {

  let current = corridor

  const width = handle => {
    const distance = handle.getLatLng().distanceTo(current.latlngs[0])
    const width = distance * 2
    return width
  }

  const update = (latlngs, width = current.width) => {

    const valid = options.valid
      ? options.valid(width)
      : true

    if (!valid) return current

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

    const segmentMetrics = latlngs => {
      const segments = R.aperture(2, latlngs).map(L.LatLng.line)

      const { minDistance, maxDistance } = segments
        .map(line => line.distance())
        .reduce((acc, distance) => {
          if (distance < acc.minDistance) acc.minDistance = distance
          if (distance > acc.maxDistance) acc.maxDistance = distance
          return acc
        }, ({ minDistance: Number.MAX_VALUE, maxDistance: 0 }))

      const maxAngle = R.aperture(2, segments)
        .map(([A, B]) => A.angle(B))
        .reduce((acc, x) => Math.max(acc, x), 0)

      return {
        minDistance,
        maxDistance,
        maxAngle
      }
    }

    // Downstream editor: polyline + width
    const width = (() => {

      const options = {
        valid: width => {
          const { minDistance } = segmentMetrics(this._geometry.latlngs)
          return width >= 100 && width <= 10000 && width < minDistance
        }
      }

      return widthEditor(this._geometry, layer, options)((channel, corridor) => {
        this._geometry = corridor
        callback(channel, this._geometry)
      })
    })()

    ;(() => {
      const options = {
        closed: false,
        midways: ('midways' in this) ? this.midways : true,
        valid: latlngs => {
          const { minDistance, maxAngle } = segmentMetrics(latlngs)
          return minDistance > this._geometry.width && maxAngle < 120
        }
      }

      // Upstream editor: polyline only
      polyEditor(this._geometry.latlngs, layer, options)((channel, latlngs) => {
        this._geometry = corridorGeometry(latlngs, this._geometry.width)
        width(latlngs)
        callback(channel, this._geometry)
      })
    })()

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
    // width property name: support old (geometry_width) and new (corridor_area_width_dim)
    const width = feature.properties.geometry_width || feature.properties.corridor_area_width_dim
    this._geometry = corridorGeometry(latlngs, width)

    this._shapeOptions = {
      interactive: this.options.interactive,
      styles: (this.options.styles ? this.options.styles : styles)(feature),
      labels: (this.options.labels ? this.options.labels : () => [])(feature)
    }
  }
})

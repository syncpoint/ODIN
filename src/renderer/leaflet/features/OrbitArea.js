import L from 'leaflet'
import './Feature'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { line } from './geo-helper'
import { styles } from '../features/styles'
import { FULCRUM } from './handle-types'
import { wrap360 } from '../geodesy'

/* eslint-disable object-property-newline */

/**
 *
 */
const orbitGeometry = (latlngs, width, alignment) => {

  const create = current => {
    const { latlngs, width, alignment } = current
    const [A, B] = latlngs

    const initialBearing = A.initialBearingTo(B)
    const finalBearing = A.finalBearingTo(B)
    const offset = alignment === 'RIGHT' ? 90 : -90

    const A1 = A.destinationPoint(width, initialBearing + offset)
    const B1 = B.destinationPoint(width, finalBearing + offset)

    return {
      copy: properties => create({ ...current, ...properties }),
      A, B, A1, B1,
      width,
      alignment
    }
  }

  return create({ latlngs, width, alignment })
}

/**
 *
 */
L.TACGRP.OrbitArea = L.TACGRP.Feature.extend({

  /**
   * Project WGS84 geometry to pixel/layer coordinates.
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)

    const A = layerPoint(this._geometry.A)
    const B = layerPoint(this._geometry.B)
    const A1 = layerPoint(this._geometry.A1)
    const B1 = layerPoint(this._geometry.B1)

    this._frame = {
      A, B, A1, B1,
      width: line([A, A1]).d,
      alignment: this._geometry.alignment
    }
  },

  _geometryEditor () {
    const layer = new L.Handles().addTo(this._map)

    const handlers = {
      A: {
        latlng: orbit => orbit.A,
        orbit: latlng => this._geometry.copy({ latlngs: [latlng, this._geometry.B] })
      },
      B: {
        latlng: orbit => orbit.B,
        orbit: latlng => this._geometry.copy({ latlngs: [this._geometry.A, latlng] })
      },
      A1: {
        latlng: orbit => orbit.A1,
        orbit: latlng => {
          const a1 = this._geometry.A.initialBearingTo(this._geometry.B)
          const a2 = this._geometry.A.initialBearingTo(latlng)
          const alignment = wrap360(a2 - a1) < 180 ? 'RIGHT' : 'LEFT'
          return this._geometry.copy({ width: this._geometry.A.distance(latlng), alignment })
        }
      },
      B1: {
        latlng: orbit => orbit.B1,
        orbit: latlng => {
          const a1 = this._geometry.A.finalBearingTo(this._geometry.B)
          const a2 = this._geometry.B.initialBearingTo(latlng)
          const alignment = wrap360(a2 - a1) < 180 ? 'RIGHT' : 'LEFT'
          return this._geometry.copy({ width: this._geometry.B.distance(latlng), alignment })
        }
      }
    }

    const update = (channel, orbit) => {
      this._geometry = orbit
      this._reset()
      Object.keys(handlers).forEach(id => handles[id].setLatLng(orbit[id]))

      if (channel === 'dragend') {
        const geometry = toGeometry('MultiPoint', [orbit.A, orbit.B])
        const properties = {
          geometry_width: orbit.width,
          geometry_alignment: orbit.alignment
        }

        return this.options.update({ geometry, properties })
      }
    }

    const handles = Object.entries(handlers).reduce((acc, [id, handler]) => {
      const handleOptions = {
        type: FULCRUM,
        drag: ({ target }) => update('drag', handler.orbit(target.getLatLng())),
        dragend: ({ target }) => update('dragend', handler.orbit(target.getLatLng()))
      }

      const latlng = handler.latlng(this._geometry)
      acc[id] = layer.addHandle(latlng, handleOptions)
      return acc
    }, {})

    return {
      dispose: () => this._map.removeLayer(layer)
    }
  },


  /**
   *
   */
  _setFeature (feature) {
    const latlngs = toLatLngs(feature.geometry)
    const width = feature.properties.geometry_width || feature.properties.orbit_area_width_dim
    const alignment = feature.properties.geometry_alignment || feature.properties.orbit_area_alignment_code
    this._geometry = orbitGeometry(latlngs, width, alignment)

    this._shapeOptions = {
      interactive: this.options.interactive,
      styles: (this.options.styles ? this.options.styles : styles)(feature),
      labels: (this.options.labels ? this.options.labels : () => [])(feature)
    }
  }
})

import L from 'leaflet'
import './Feature'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { line } from './geo-helper'
import { FULCRUM } from './handle-types'

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


    this._svg.updateFrame({
      A, B, A1, B1,
      width: line([A, A1]).d,
      alignment: this._geometry.alignment
    })
  },

  _geometryEditor () {
    const layer = new L.Handles().addTo(this._map)
    let current = this._geometry

    const handlers = {
      A: {
        latlng: orbit => orbit.A,
        orbit: latlng => current.copy({ latlngs: [latlng, current.B] })
      },
      B: {
        latlng: orbit => orbit.B,
        orbit: latlng => current.copy({ latlngs: [current.A, latlng] })
      },
      A1: {
        latlng: orbit => orbit.A1,
        orbit: latlng => current.copy({ width: current.A.distance(latlng) })
      },
      B1: {
        latlng: orbit => orbit.B1,
        orbit: latlng => current.copy({ width: current.B.distance(latlng) })
      }
    }

    const update = (channel, orbit) => {
      this._geometry = current = orbit
      this._project()
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

      const latlng = handler.latlng(current)
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
    const width = feature.properties.geometry_width
    const alignment = feature.properties.geometry_alignment
    this._geometry = orbitGeometry(latlngs, width, alignment)

    this._shapeOptions = {
      interactive: this.options.interactive,
      labels: this._labels(feature),
      styles: this._styles(feature)
    }
  }
})

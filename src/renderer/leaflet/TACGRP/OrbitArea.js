/* eslint-disable */

import L from 'leaflet'
import './Feature'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { line } from './shapes/geo-helper'

const orbitGeometry = (latlngs, width, alignment) => {
  const [A, B] = latlngs

  const initialBearing = A.initialBearingTo(B)
  const finalBearing = A.finalBearingTo(B)
  const offset = alignment === 'RIGHT' ? 90 : -90

  const A1 = A.destinationPoint(width, initialBearing + offset)
  const B1 = B.destinationPoint(width, finalBearing + offset)

  return {
    envelope: { A, B, A1, B1 },
    width,
    alignment
  }
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

    const envelope = Object.entries(this._orbit.envelope).reduce((acc, [key, value]) => {
      acc[key] = layerPoint(value)
      return acc
    }, {})

    this._shape.updateFrame({
      envelope,
      width: line([envelope.A, envelope.A1]).d,
      alignment: this._orbit.alignment
    })
  },

  _editor () {
    const layer = new L.Feature.Handles().addTo(this._map)
    return {
      dispose: () => this._map.removeLayer(layer)
    }
  },


  /**
   *
   */
  _setFeature (feature) {
    console.log(feature.geometry)
    const latlngs = toLatLngs(feature.geometry)
    console.log('latlngs', latlngs)
    const width = feature.properties.geometry_width
    const alignment = feature.properties.geometry_alignment
    this._orbit = orbitGeometry(latlngs, width, alignment)

    this._shapeOptions = {
      interactive: this.options.interactive,
      labels: this._labels(feature),
      styles: this._styles(feature)
    }
  }
})

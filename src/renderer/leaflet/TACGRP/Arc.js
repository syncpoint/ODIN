/* eslint-disable */

import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { line } from './shapes/geo-helper'
import { arcGeometry } from './arc-geometry'

L.TACGRP.Arc = L.TACGRP.Feature.extend({

  /**
   *
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    const C = layerPoint(this._arc.latlng)
    const O = layerPoint(this._arc.O)
    const S = layerPoint(this._arc.S)

    this._shape.updateFrame({
      C,
      O,
      S,
      radius: line([C, O]).d,
      radians: this._arc.radians
    })
  },

  /**
   *
   */
  _setFeature (feature) {
    /* eslint-disable camelcase */
    const { geometry_max_range, geometry_orient_angle, geometry_size_angle } = feature.properties

    this._arc = arcGeometry(
      toLatLngs(feature.geometry),
      geometry_orient_angle,
      geometry_size_angle,
      geometry_max_range
    )

    this._shapeOptions = {
      interactive: this.options.interactive,
      labels: this._labels(),
      styles: this._styles(feature)
    }
  }
})

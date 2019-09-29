import L from 'leaflet'
import GeoJSON from '../GeoJSON'
import { corridorGeometry } from './corridor-geometry'

/**
 *
 */
L.TACGRP = L.TACGRP || {}
L.TACGRP.Corridor = L.Layer.extend({

  initialize (feature, options) {
    L.setOptions(this, options)

    const latlngs = GeoJSON.latlng(feature.geometry)
    const width = feature.geometry.width
    this._corridor = corridorGeometry(latlngs, width)
  },

  beforeAdd (map) {
    this._map = map
    this._renderer = map.getRenderer(this)
  },

  onAdd (/* map */) {
    this._renderer._initGroup(this)
    this._shape = this._shape(this._group)
    this._project()
    this._renderer._addGroup(this)
    this._shape.attached()
  },


  /**
   *
   */
  onRemove (/* map */) {
    this._renderer._removeGroup(this)
  },


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

  /**
   * Required by L.Renderer, but
   * NOOP since we handle shape state in layer.
   */
  _update () {
  }
})

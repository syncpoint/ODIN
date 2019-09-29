import L from 'leaflet'
import GeoJSON from '../GeoJSON'
import { corridorGeometry } from './corridor-geometry'
import selection from '../../components/App.selection'

/**
 *
 */
L.TACGRP = L.TACGRP || {}
L.TACGRP.Corridor = L.Layer.extend({


  /**
   *
   */
  initialize (feature, options) {
    L.setOptions(this, options)
    this._setFeature(feature)
  },


  /**
   *
   */
  beforeAdd (map) {
    this._map = map
    this._renderer = map.getRenderer(this)
  },


  /**
   *
   */
  onAdd (/* map */) {

    // TODO: should layer mediate between renderer and shape,
    // TODO: or should renderer directly deal with shape.

    const shapeOptions = {
      interactive: this.options.interactive
    }

    this._renderer._initGroup(this)
    this._shape = this._shape(this._group, shapeOptions)
    this._project()
    this._renderer._addGroup(this)

    this.on('click', this._edit, this)
  },


  /**
   *
   */
  onRemove (/* map */) {
    this.off('click', this._edit, this)
    this._renderer._removeGroup(this)
    this._map.tools.dispose() // dispose editor/selection tool
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
   * Required by L.Renderer, but NOOP since we handle shape state in layer.
   * NOTE: Called twice after map was panned, so implementation should be fast.
   */
  _update () {
  },


  /**
   *
   */
  _edit () {

    if (selection.isSelected(this.urn)) return
    selection.select(this.urn)

    const callback = event => {
      switch (event.type) {
        case 'latlngs': {
          const width = this._feature.geometry.width
          this._corridor = corridorGeometry(event.latlngs, width)
          return this._project()
        }
        case 'geometry': return this.options.update({ geometry: event.geometry })
      }
    }

    this._markerGroup = new L.Feature.MarkerGroup(this._feature.geometry, callback).addTo(this._map)

    const editor = {
      dispose: () => {
        this._map.removeLayer(this._markerGroup)
        delete this._markerGroup
        selection.isSelected(this.urn) && selection.deselect()
      }
    }

    this._map.tools.edit(editor)
  },

  _setFeature (feature) {
    this._feature = feature
    const width = this._feature.geometry.width
    const latlngs = GeoJSON.latlng(this._feature.geometry)
    this._corridor = corridorGeometry(latlngs, width)
  },

  updateData (feature) {
    this._setFeature(feature)
    this._project()
    if (this.markerGroup) this.markerGroup.updateGeometry(this._feature.geometry)
  }
})

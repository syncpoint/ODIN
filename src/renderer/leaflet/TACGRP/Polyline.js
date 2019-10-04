/* eslint-disable */

import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { polylineShape } from './shapes/polyline-shape'
import selection from '../../components/App.selection'
import { doublyLinkedList } from '../../../shared/lists'
import './Handles'
import { polyEditor } from './poly-editor'
import { styles } from './styles'

L.TACGRP = L.TACGRP || {}
L.TACGRP.Polyline = L.Layer.extend({


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
    this._renderer._initGroup(this)
    this._shape = this._shape(this._group)
    this._project()
    this._renderer._addGroup(this)
    this._shape.attached() // we are live!

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
      points: this._latlngs.map(layerPoint)
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

    const callback = (channel, latlngs) => {
      switch (channel) {
        case 'drag': {
          this._latlngs = latlngs
          return this._project()
        }
        case 'dragend': {
          const geometry = toGeometry('LineString', latlngs)
          return this.options.update({ geometry })
        }
      }
    }

    const polylineEditor = (latlngs, callback) => {
      let current = latlngs
      const layer = new L.Feature.Handles().addTo(this._map)

      // Upstream editor: polyline only
      polyEditor(current, layer, doublyLinkedList(), (channel, latlngs) => {
        current = latlngs
        callback(channel, current)
      })

      return {
        dispose: () => {
          this._map.removeLayer(layer)
          selection.isSelected(this.urn) && selection.deselect()
        }
      }
    }

    const editor = polylineEditor(this._latlngs, callback)
    this._map.tools.edit(editor)
  },


  /**
   *
   */
  _setFeature (feature) {
    this._latlngs = toLatLngs(feature.geometry)
    this._shapeOptions = {
      interactive: this.options.interactive,
      lineSmoothing: this.options.lineSmoothing,
      styles: styles(feature),
      labels: []
    }
  },


  /**
   *
   */
  updateData (feature) {
    this._setFeature(feature)
    this._project()

    this._shape.updateOptions(this._shapeOptions)
  },


  /**
   *
   */
  _shape (group) {
    return polylineShape(group, this._shapeOptions)
  }
})

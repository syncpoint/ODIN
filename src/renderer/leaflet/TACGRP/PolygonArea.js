/* eslint-disable */

import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { polygonShape } from './shapes/polygon-shape'
import selection from '../../components/App.selection'
import { circularDoublyLinkedList } from '../../../shared/lists'
import './Handles'
import { polyEditor } from './poly-editor'

L.TACGRP = L.TACGRP || {}
L.TACGRP.PolygonArea = L.Layer.extend({


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
      rings: this._rings.map(ring => ring.map(layerPoint))
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

    const callback = (channel, rings) => {
      switch (channel) {
        case 'drag': {
          this._rings = rings
          return this._project()
        }
        case 'dragend': {
          const geometry = toGeometry('Polygon', rings)
          return this.options.update({ geometry })
        }
      }
    }

    const polygonEditor = (rings, callback) => {
      let current = rings[0]
      const layer = new L.Feature.Handles().addTo(this._map)

      // Upstream editor: polyline only
      polyEditor(current, layer, circularDoublyLinkedList(), (channel, latlngs) => {
        current = latlngs
        callback(channel, [current])
      })

      return {
        dispose: () => {
          this._map.removeLayer(layer)
          selection.isSelected(this.urn) && selection.deselect()
        }
      }
    }

    const editor = polygonEditor(this._rings, callback)
    this._map.tools.edit(editor)
  },


  /**
   *
   */
  _setFeature (feature) {
    this._rings = toLatLngs(feature.geometry)
    this._shapeOptions = {
      interactive: this.options.interactive,
      lineSmoothing: this.options.lineSmoothing,
      styles: this.options.styles(feature),
      labels: this.options.labels(feature)
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
    return polygonShape(group, this._shapeOptions)
  }
})

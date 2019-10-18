import L from 'leaflet'
import * as R from 'ramda'
import selection from '../../components/App.selection'
import { styles } from './styles'
import './Handles'

// TODO: defaultOptions (styles)
// TODO: implement _bounds for each feature type

// Namespace for all symbol and graphics features.
L.Feature = {}

/**
 * Abstract feature.
 * Define the follow to subclass:
 * - _project()
 * - _editor()
 * - _setFeature()
 */
L.TACGRP = L.TACGRP || {}
L.TACGRP.Feature = L.Layer.extend({


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
    this._attach()
    this.on('click', () => this._edit())
  },


  /**
   *
   */
  onRemove (/* map */) {
    this.off('click')
    this._map.tools.dispose() // dispose editor/selection tool

    if (!this._svg) return
    delete this._state
    this._detach()
  },


  _attach () {
    this._renderer._initGroup(this)
    this._svg = this._shape(this._group, this._shapeOptions)
    this._reset()
    this._renderer._addGroup(this)
    this._svg.attached && this._svg.attached()
    if (selection.isPreselected(this.urn)) setImmediate(() => this._edit())
  },

  _detach () {
    this._renderer._removeGroup(this)
    this._svg = null
    this._state = { ...this._state, attached: false }
  },

  /**
   * TODO: Reverse dependency: Selection should trigger edit (if editable).
   */
  _edit (reset) {
    if (!reset) {
      // suspend click not to re-enter edit:
      this.off('click')
      selection.select(this.urn)
    }

    if (this._editor) this._editor.dispose()
    this._editor = this._geometryEditor()

    if (reset) return

    // On reset: Leave editor tool intact, only create new editor.
    this._map.tools.edit({
      dispose: () => {
        // resume click:
        this.on('click', () => this._edit())
        this._editor.dispose()
      }
    })
  },

  _labels (feature) { return [] },
  _styles (feature) { return styles(feature) },

  /**
   * Required by L.Renderer, but NOOP since we handle shape state in layer.
   * NOTE: Called twice after map was panned, so implementation should be fast.
   */
  _update () {
    const state = {
      center: this._map.getCenter(),
      zoom: this._map.getZoom(),
      geometry: this._geometry
    }

    // Guard against updating too often:
    if (R.equals(this._state, state)) return
    this._state = state
    this._frame && this._svg.updateFrame(this._frame)
  },


  /**
   *
   */
  _reset () {
    this._project()
    this._update()
  },


  /**
   *
   */
  updateData (feature) {
    this._setFeature(feature)
    this._reset()
    this._svg.updateOptions && this._svg.updateOptions(this._shapeOptions)
    this._edit(true)
  }
})

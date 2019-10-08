import L from 'leaflet'
import selection from '../../components/App.selection'
import { styles } from './styles'
import './Handles'

// TODO: defaultOptions (styles)

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
    this._renderer._initGroup(this)
    this._shape = this._shape(this._group, this._shapeOptions)
    this._project()
    this._renderer._addGroup(this)
    this._shape.attached && this._shape.attached()
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
   *
   */
  _edit () {
    if (selection.isSelected(this.urn)) return
    selection.select(this.urn)

    const editor = this._editor()
    this._map.tools.edit({
      dispose: () => {
        editor.dispose()
        selection.isSelected(this.urn) && selection.deselect()
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
  },


  /**
   *
   */
  _reset () {
    this._project()
  },


  /**
   *
   */
  updateData (feature) {
    this._setFeature(feature)
    this._project()
    this._shape.updateOptions && this._shape.updateOptions(this._shapeOptions)
  }
})

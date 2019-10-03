import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { corridorGeometry } from './corridor-geometry'
import selection from '../../components/App.selection'
import { doublyLinkedList } from '../../../shared/lists'
import './Handles'
import { polyEditor } from './poly-editor'
import { widthEditor } from './width-editor'

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

    const callback = (channel, corridor) => {
      switch (channel) {
        case 'drag': {
          this._corridor = corridor
          return this._project()
        }
        case 'dragend': {
          const geometry = toGeometry('LineString', corridor.latlngs)
          return this.options.update({ geometry, properties: { geometry_width: corridor.width } })
        }
      }
    }

    const corridorEditor = (corridor, callback) => {
      let current = corridor
      const layer = new L.Feature.Handles().addTo(this._map)

      // Downstream editor: polyline + width
      const width = widthEditor(current, layer, (channel, corridor) => {
        current = corridor
        callback(channel, current)
      })

      // Upstream editor: polyline only
      polyEditor(current.latlngs, layer, doublyLinkedList(), (channel, latlngs) => {
        current = corridorGeometry(latlngs, current.width)
        width(latlngs)
        callback(channel, current)
      })

      return {
        dispose: () => {
          this._map.removeLayer(layer)
          selection.isSelected(this.urn) && selection.deselect()
        }
      }
    }

    const editor = corridorEditor(this._corridor, callback)
    this._map.tools.edit(editor)
  },

  _setFeature (feature) {
    const latlngs = toLatLngs(feature.geometry)
    const width = feature.properties.geometry_width
    this._corridor = corridorGeometry(latlngs, width)
  },

  updateData (feature) {
    this._setFeature(feature)
    this._project()

    // TODO: update editor's geometry if necessary
    // const geometry = toGeometry('LineString', this._corridor.latlngs)
    // ...
  }
})

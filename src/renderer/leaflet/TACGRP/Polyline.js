/* eslint-disable */

import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import './Feature'
import { polylineShape } from './shapes/polyline-shape'
import selection from '../../components/App.selection'
import { doublyLinkedList } from '../../../shared/lists'
import './Handles'
import { polyEditor } from './poly-editor'
import { styles } from './styles'

L.TACGRP.Polyline = L.TACGRP.Feature.extend({

  /**
   *
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    this._shape.updateFrame({
      points: this._latlngs.map(layerPoint)
    })
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
  _shape (group) {
    return polylineShape(group, this._shapeOptions)
  }
})

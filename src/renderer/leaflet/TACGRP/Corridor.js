import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import './Feature'
import { corridorGeometry } from './corridor-geometry'
import selection from '../../components/App.selection'
import { doublyLinkedList } from '../../../shared/lists'
import './Handles'
import { polyEditor } from './poly-editor'
import { widthEditor } from './width-editor'
import { styles } from './styles'

/**
 * Abstract corridor.
 * Define the follow to subclass:
 * - _shape()
 */
L.TACGRP.Corridor = L.TACGRP.Feature.extend({

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


  /**
   *
   */
  _setFeature (feature) {
    const latlngs = toLatLngs(feature.geometry)
    const width = feature.properties.geometry_width
    this._corridor = corridorGeometry(latlngs, width)

    this._shapeOptions = {
      interactive: this.options.interactive,
      styles: styles(feature)
    }
  }
})

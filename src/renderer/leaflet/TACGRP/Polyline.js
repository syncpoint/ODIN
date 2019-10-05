import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import './Feature'
import { svgBuilder } from './shapes/svg-builder'
import { doublyLinkedList } from '../../../shared/lists'
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
  _editor () {
    const layer = new L.Feature.Handles().addTo(this._map)
    let current = this._latlngs

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

    // Upstream editor: polyline only
    polyEditor(current, layer, doublyLinkedList(), (channel, latlngs) => {
      current = latlngs
      callback(channel, current)
    })

    return {
      dispose: () => this._map.removeLayer(layer)
    }
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
      stylesX: this._stylesX(feature),
      labels: []
    }
  },


  /**
   *
   */
  _shape (group, options) {
    return svgBuilder(group, options, {
      points: ({ points }) => [points]
    })
  }
})

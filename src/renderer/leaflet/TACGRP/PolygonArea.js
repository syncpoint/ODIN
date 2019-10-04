import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import './Feature'
import { polygonShape } from './shapes/polygon-shape'
import { circularDoublyLinkedList } from '../../../shared/lists'
import { polyEditor } from './poly-editor'
import { stylesX } from './styles'

L.TACGRP.PolygonArea = L.TACGRP.Feature.extend({


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
   *
   */
  _editor () {
    const layer = new L.Feature.Handles().addTo(this._map)
    let current = this._rings[0]

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

    polyEditor(current, layer, circularDoublyLinkedList(), (channel, latlngs) => {
      current = latlngs
      callback(channel, [current])
    })

    return {
      dispose: () => this._map.removeLayer(layer)
    }
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
      stylesX: stylesX(feature),
      labels: this.options.labels(feature)
    }
  },


  /**
   *
   */
  _shape (group) {
    return polygonShape(group, this._shapeOptions)
  }
})

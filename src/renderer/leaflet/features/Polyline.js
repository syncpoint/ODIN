import L from 'leaflet'
import bbox from '@turf/bbox'
import { toLatLngs, toGeometry } from '../GeoJSON'
import './Feature'
import { shape } from './shape'
import { polyEditor } from './poly-editor'
import { styles } from '../features/styles'

const placements = ({ points }) => ({
  'start': points[0],
  'end': points[points.length - 1]
})

L.TACGRP.Polyline = L.TACGRP.Feature.extend({

  /**
   *
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    this._frame = {
      points: this._geometry.map(layerPoint)
    }
  },


  /**
   *
   */
  _geometryEditor () {
    const layer = new L.Handles().addTo(this._map)

    const options = {
      closed: false,
      midways: ('midways' in this) ? this.midways : true
    }

    polyEditor(this._geometry, layer, options)((channel, latlngs) => {
      this._geometry = latlngs
      this._reset()

      if (channel === 'dragend') {
        const geometry = toGeometry('LineString', latlngs)
        this.options.update({ geometry })
      }
    })

    return {
      dispose: () => this._map.removeLayer(layer)
    }
  },


  /**
   *
   */
  _setFeature (feature) {
    this._geometry = toLatLngs(feature.geometry)

    const box = bbox(feature)
    this._bounds = L.latLngBounds(
      L.latLng(box[1], box[0]),
      L.latLng(box[3], box[2])
    )

    this._shapeOptions = {
      interactive: this.options.interactive,
      lineSmoothing: ('lineSmoothing' in this) ? this.lineSmoothing : this.options.lineSmoothing,
      hideLabels: this.options.hideLabels,
      styles: (this.options.styles ? this.options.styles : styles)(feature),
      labels: (this.options.labels ? this.options.labels : () => [])(feature)
    }
  },


  /**
   *
   */
  _shape (group, options) {
    options.styles.clipping = 'mask'
    return shape(group, options, {
      placements,
      points: ({ points }) => [points]
    })
  }
})

import L from 'leaflet'
import { line } from '../features/geo-helper'
import { shape } from '../features/shape'
import '../features/Corridor2Point'


L.Feature['G*T*B-----'] = L.TACGRP.Corridor2Point.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ center, envelope }) => [center, envelope[0]]
    })
  },

  _labels () {
    return [{
      placement: ({ center }) => line(center).point(0.5),
      lines: ['B'],
      'font-size': 18,
      angle: ({ center }) => line(center).angle()
    }]
  }
})

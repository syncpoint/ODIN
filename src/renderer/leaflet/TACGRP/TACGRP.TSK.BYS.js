import L from 'leaflet'
import { line, calcStruts } from '../features/geo-helper'
import { shape } from '../features/shape'
import '../features/Corridor'

L.Feature['G*T*Y-----'] = L.TACGRP.Corridor.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ center, envelope }) => {
        const s = calcStruts(center, envelope)([0.1])
        return [
          [envelope[0][0], envelope[1][0], envelope[1][1], envelope[0][1]],
          [s[0].point(1.1), envelope[0][1], s[0].point(0.9)],
          [s[0].point(-0.1), envelope[0][0], s[0].point(0.1)]
        ]
      }
    })
  },

  _labels () {
    return [{
      placement: ({ envelope }) => line(envelope[1]).point(0.5),
      lines: ['B'],
      'font-size': 18,
      angle: ({ envelope }) => line(envelope[1]).angle() + 90
    }]
  }
})

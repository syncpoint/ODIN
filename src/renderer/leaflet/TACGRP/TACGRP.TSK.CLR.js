import L from 'leaflet'
import { line, calcStruts2 } from '../features/geo-helper'
import { shape } from '../features/shape'
import '../features/Corridor'

L.Feature['G*T*X-----'] = L.TACGRP.Corridor.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ center, envelope }) => {
        const s = calcStruts2(center, envelope)([0.1, 0, 1])
        return [
          s[1].points,
          [s[1].point(0.1), s[2].point(0.1)],
          [s[0].point(0), s[1].point(0.1), s[0].point(0.2)],
          center,
          [s[0].point(0.4), center[0], s[0].point(0.6)],
          [s[1].point(0.9), s[2].point(0.9)],
          [s[0].point(1), s[1].point(0.9), s[0].point(0.8)]
        ]
      }
    })
  },

  _labels () {
    return [{
      placement: ({ center }) => line(center).point(0.5),
      alignment: 'center', // default
      lines: ['C'],
      'font-size': 18,
      angle: ({ center }) => line(center).angle()
    }]
  }
})

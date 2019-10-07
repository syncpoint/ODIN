import L from 'leaflet'
import { line, calcStruts2 } from '../features/geo-helper'
import { shape } from '../features/shape'
import '../features/Corridor'

L.Feature['G*T*P-----'] = L.TACGRP.Corridor.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ center, envelope }) => {
        const s = calcStruts2(center, envelope)([0.1, 0])
        return [
          s[1].points,
          center,
          [s[0].point(0.4), center[0], s[0].point(0.6)]
        ]
      }
    })
  },

  _labels () {
    return [{
      placement: ({ center }) => line(center).point(0.5),
      alignment: 'center', // default
      lines: ['P'],
      'font-size': 18,
      angle: ({ center }) => line(center).angle()
    }]
  }
})

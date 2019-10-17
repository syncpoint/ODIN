import L from 'leaflet'
import * as R from 'ramda'
import { shape } from '../features/react-shape'
import '../features/OrbitArea'
import { line, arc } from '../features/geo-helper'

L.Feature['G*T*R-----'] = L.TACGRP.OrbitArea.extend({

  _shape (group, options) {
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ A, B, A1, B1, alignment, width }) => {
        const centerLine = line([A, B])
        const center = line([B, B1]).point(0.5)
        const angle = centerLine.angle() / 180 * Math.PI + Math.PI / 2

        const steps = 32
        const delta = Math.PI / steps

        const xs = R.range(0, steps + 1).map(x => angle + x * delta)
        if (alignment === 'RIGHT') xs.reverse()

        const arrow = (tip, line) => [
          line.translate(0.1 * width).point(0.85),
          tip,
          line.translate(-0.1 * width).point(0.85)
        ]

        return [
          [A1, B1, ...arc(center, width / 2)(xs), B, A],
          arrow(B, centerLine),
          arrow(A1, line([B1, A1]))
        ]
      }
    })
  },

  _labels () {
    return [{
      placement: ({ A, B }) => line([A, B]).point(0.5),
      lines: ['RIP'],
      'font-size': 18,
      angle: ({ A, B }) => line([A, B]).angle()
    }]
  }
})

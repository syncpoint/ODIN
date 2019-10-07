import L from 'leaflet'
import * as R from 'ramda'
import { shape } from './shapes/shape'
import './OrbitArea'
import { line, arc } from './shapes/geo-helper'

L.Feature['G*T*L-----'] = L.TACGRP.OrbitArea.extend({
  labelText: 'D',

  _shape (group, options) {
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ envelope, width }) => {
        const { A, B, A1 } = envelope
        const centerLine = line([A, B])
        const center = line([A, A1]).point(0.5)
        const angle = centerLine.angle() / 180 * Math.PI - Math.PI / 2

        const steps = 32
        const delta = Math.PI / steps
        const xs = R.range(0, steps + 1).map(x => angle + x * delta)

        const arrow = (tip, line) => [
          line.translate(0.1 * width).point(0.85),
          tip,
          line.translate(-0.1 * width).point(0.85)
        ]

        return [
          [...arc(center, width / 2)(xs)],
          [A, B],
          arrow(B, centerLine)
        ]
      }
    })
  },

  _labels () {
    return [{
      placement: ({ envelope }) => line([envelope.A, envelope.B]).point(0.5),
      lines: [this.labelText],
      'font-size': 18,
      angle: ({ envelope }) => line([envelope.A, envelope.B]).angle()
    }]
  }
})

L.Feature['G*T*W-----'] = L.Feature['G*T*L-----'].extend({
  labelText: 'W'
})

L.Feature['G*T*WP----'] = L.Feature['G*T*L-----'].extend({
  labelText: 'WP'
})

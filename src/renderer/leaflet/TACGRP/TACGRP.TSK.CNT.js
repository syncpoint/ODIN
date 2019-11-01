import L from 'leaflet'
import * as R from 'ramda'
import { line, calcStruts2, arc } from '../features/geo-helper'
import { shape } from '../features/shape'
import '../features/Corridor2Point'

const CNT = L.TACGRP.Corridor2Point.extend({

  _shape (group, options) {
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ center, envelope }) => {
        const angle = (line(center).angle() - 90) / 180 * Math.PI
        const s = calcStruts2(center, envelope)([0.1])
        const xs = R.range(0, 33).map(x => angle + (x / 32) * Math.PI)
        const outer = arc(center[0], s[0].d / 2)(xs)
        const inner = arc(center[0], s[0].d / 3)(xs)
        const spikes = R.zip(outer, inner).filter((_, i) => i % 4 === 0)

        return [
          center,
          outer, ...spikes,
          [s[0].point(0.4), center[0], s[0].point(0.6)]
        ]
      }
    })
  }
})

L.Feature['G*T*J-----'] = (feature, options) => {
  options.labels = () => [{
    placement: ({ center }) => line(center).point(0.5),
    lines: ['ENY'],
    'font-size': 18,
    angle: ({ center }) => line(center).angle()
  },
  {
    placement: ({ center, envelope }) => {
      const centerLine = line(center)
      const width = line(envelope[0]).d
      return centerLine.point(-0.5 * width / centerLine.d)
    },
    lines: ['C'],
    'font-size': 18,
    angle: ({ center }) => line(center).angle()
  }]

  return new CNT(feature, options)
}

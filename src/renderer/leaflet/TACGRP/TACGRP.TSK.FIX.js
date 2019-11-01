import L from 'leaflet'
import * as R from 'ramda'
import { line } from '../features/geo-helper'
import { shape } from '../features/shape'
import '../features/Line2Point'

const FIX = L.TACGRP.Line2Point.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ points }) => {
        const centerLine = line(points)
        const width = 0.1 * centerLine.d
        const L1 = centerLine.translate(width)
        const L2 = centerLine.translate(-width)

        const steps = 8
        const zigzag = R.range(0, steps).reduce((acc, i) => {
          const line = i % 2 === 0 ? L1 : L2
          acc.push(L.point(line.point(0.28125 + 0.5 / steps * i)))
          return acc
        }, [])

        const arrow = (tip, line) => [
          line.translate(width / 1.5).point(0.9),
          tip,
          line.translate(-width / 1.5).point(0.9)
        ]

        return [[
          points[0],
          centerLine.point(0.25),
          ...zigzag,
          centerLine.point(0.75),
          points[1]
        ], arrow(points[1], centerLine)]
      }
    })
  }
})

L.Feature['G*T*F-----'] = (feature, options) => {
  options.labels = () => [{
    placement: ({ points }) => line(points).point(0.125),
    lines: ['F'],
    'font-size': 18,
    angle: ({ points }) => line(points).angle()
  }]

  return new FIX(feature, options)
}

import L from 'leaflet'
import * as R from 'ramda'
import { line, calcStruts2 } from './shapes/geo-helper'
import { shape } from './shapes/shape'
import './Corridor'

const arc = (c, r) => xs => xs.map(x => L.point(r * Math.cos(x) + c.x, r * Math.sin(x) + c.y))

L.Feature['G*T*J-----'] = L.TACGRP.Corridor.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    /* eslint-disable */
    return shape(group, options, {
      points: ({ center, envelope }) => {
        const angle = (line(center).angle() - 90) / 180 * Math.PI
        const s = calcStruts2(center, envelope)([0.1])
        const xs = R.range(0, 33).map(x => angle + (x / 32) * Math.PI)
        const oa = arc(center[0], s[0].d / 2)(xs)
        const ia = arc(center[0], s[0].d / 3)(xs)
        const spikes = R.zip(oa, ia).filter((_, i) => i % 4 === 0)

        return [
          center,
          oa, ...spikes,
          [s[0].point(0.4), center[0], s[0].point(0.6)]
        ]
      }
    })
  },

  _labels () {
    return [{
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
  }
})

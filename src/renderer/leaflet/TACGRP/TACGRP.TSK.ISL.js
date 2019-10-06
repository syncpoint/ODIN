import L from 'leaflet'
import * as R from 'ramda'
import { arc } from './shapes/geo-helper'
import { shape } from './shapes/shape'
import './Arc'

L.Feature['G*T*E-----'] = L.TACGRP.Arc.extend({

  _shape (group, options) {
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ C, radius, radians }) => {
        const steps = 64
        const delta = radians.delta / steps
        const xs = R.range(0, steps).map(x => radians.start + x * delta)

        const outer = arc(C, radius)(xs)
        const inner = arc(C, radius * 0.8)(xs)

        const teeth = []
        for (let i = 1; i < outer.length - 1; i++) {
          if (i % 5 === 0) {
            teeth.push([outer[i - 1], inner[i], outer[i + 1]])
          }
        }

        return [
          outer, ...teeth
        ]
      }
    })
  },

  _labels () {
    const alpha = radians => radians.start + radians.delta / 2
    return [{
      placement: ({ C, radius, radians }) => arc(C, radius)([alpha(radians)])[0],
      lines: ['I'],
      'font-size': 18,
      angle: ({ C, radians }) => alpha(radians) / Math.PI * 180
    }]
  }
})

import L from 'leaflet'
import '../features/Corridor'
import { calcStruts, line } from '../features/geo-helper'
import { shape } from '../features/shape'
import { styles, strokeDashArray } from '../features/styles'

const CATKF = L.TACGRP.Corridor.extend({
  _shape (group, options) {
    const points = ({ center, envelope }) => {
      const dw = line(envelope[0]).d
      const s0 = line(center.slice(0, 2))

      // CATKF has a pretty complicated set of 'arrows'.
      const s = calcStruts(center, envelope)([ 0.2, 0.56, 1.06, 1.38, 1.84 ])
      const struts = envelope.map(line).slice(1)

      return [
        [
          ...struts.map(s => s.point(1)).reverse(),
          s[4].point(1), s[4].point(1.5),
          s0.point(1.06 * (dw / s0.d)),
          s[4].point(-0.5), s[4].point(0),
          ...struts.map(s => s.point(0))
        ],
        [
          s[2].point(-0.75),
          s[1].point(-0.5),
          s[1].point(1.5),
          s[2].point(1.75)
        ],
        [s0.point(0.2 * (dw / s0.d)), s0.point(0.56 * (dw / s0.d))],
        [center[0], s[0].point(0.45), s[0].point(0.55), center[0]]
      ]
    }

    return shape(group, options, { points })
  }
})

/**
 *
 */
L.Feature['G*T*KF----'] = (feature, options) => {
  options.styles = feature => {
    const _styles = styles(feature)
    _styles.contrast['stroke-dasharray'] = strokeDashArray()
    _styles.path['stroke-dasharray'] = strokeDashArray()
    return _styles
  }

  return new CATKF(feature, options)
}

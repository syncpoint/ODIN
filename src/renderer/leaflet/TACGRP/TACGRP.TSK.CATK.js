import L from 'leaflet'
import './Corridor'
import { calcStruts, line } from './shapes/geo-helper'
import { shape } from './shapes/shape'
import { styles, strokeDashArray } from './styles'

/**
 *
 */
L.Feature['G*T*K-----'] = L.TACGRP.Corridor.extend({
  _shape (group, options) {
    const points = ({ center, envelope }) => {
      const s = calcStruts(center, envelope)([ 0.38, 0.19 ])

      // Interpolate points for corridor width (half of arrow width)
      const struts = envelope.map(line).slice(1)
      return [[
        ...struts.map(s => s.point(0.75)).reverse(),
        s[0].point(0.75), s[0].point(1),
        center[0],
        s[0].point(0), s[0].point(0.25),
        ...struts.map(s => s.point(0.25))
      ]]
    }

    return shape(group, options, { points })
  },

  _styles (feature) {
    const _styles = styles(feature)
    _styles.outline['stroke-dasharray'] = strokeDashArray()
    _styles.path['stroke-dasharray'] = strokeDashArray()
    return _styles
  }
})

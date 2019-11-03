import L from 'leaflet'
import '../features/Corridor'
import { calcStruts, line } from '../features/geo-helper'
import { shape } from '../features/react-shape'
import { styles, strokeDashArray } from '../features/styles'

const CATK = L.TACGRP.Corridor.extend({
  _shape (group, options) {
    const points = ({ center, envelope }) => {
      const s = calcStruts(center, envelope)([ 0.76 ])

      const struts = envelope.map(line).slice(1)
      return [[
        ...struts.map(s => s.point(1)).reverse(),
        s[0].point(1), s[0].point(1.5),
        center[0],
        s[0].point(-0.5), s[0].point(0),
        ...struts.map(s => s.point(0))
      ]]
    }

    return shape(group, options, { points })
  }
})

/**
 *
 */
L.Feature['G*T*K-----'] = (feature, options) => {
  options.styles = feature => {
    const _styles = styles(feature)
    _styles.contrast.strokeDasharray = strokeDashArray()
    _styles.path.strokeDasharray = strokeDashArray()
    return _styles
  }

  return new CATK(feature, options)
}

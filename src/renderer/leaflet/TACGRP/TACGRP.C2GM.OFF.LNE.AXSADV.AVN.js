import L from 'leaflet'
import '../features/Corridor'
import { calcStruts, line } from '../features/geo-helper'
import { shape } from '../features/react-shape'

const AVN = L.TACGRP.Corridor.extend({
  _shape (group, options) {
    const points = ({ center, envelope }) => {
      const s = calcStruts(center, envelope)([ 0.76 ])
      const struts = envelope.map(line).slice(1)
      return [[
        ...struts.map(s => s.point(0)).reverse(),
        s[0].point(1), s[0].point(1.5),
        center[0],
        s[0].point(-0.5), s[0].point(0),
        ...struts.map(s => s.point(1))
      ]]
    }

    return shape(group, options, { points })
  }
})

/**
 * AXIS OF ADVANCE - AVIATION
 */
L.Feature['G*G*OLAV--'] = (feature, options) => new AVN(feature, options)

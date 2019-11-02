import L from 'leaflet'
import { line, calcStruts2 } from '../features/geo-helper'
import { shape } from '../features/react-shape'
import '../features/Corridor2Point'

const PNE = L.TACGRP.Corridor2Point.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ center, envelope }) => {
        const s = calcStruts2(center, envelope)([0.1, 0])
        return [
          s[1].points,
          center,
          [s[0].point(0.4), center[0], s[0].point(0.6)]
        ]
      }
    })
  }
})

L.Feature['G*T*P-----'] = (feature, options) => {
  options.labels = () => [{
    placement: ({ center }) => line(center).point(0.5),
    lines: ['P'],
    'font-size': 18,
    angle: ({ center }) => line(center).angle()
  }]

  return new PNE(feature, options)
}

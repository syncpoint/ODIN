import L from 'leaflet'
import { line, calcStruts } from '../features/geo-helper'
import { shape } from '../features/react-shape'
import '../features/Corridor2Point'

const BYS = L.TACGRP.Corridor2Point.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    return shape(group, options, {
      points: ({ center, envelope }) => {
        const s = calcStruts(center, envelope)([0.1])
        return [
          [envelope[0][0], envelope[1][0], envelope[1][1], envelope[0][1]],
          [s[0].point(1.1), envelope[0][1], s[0].point(0.9)],
          [s[0].point(-0.1), envelope[0][0], s[0].point(0.1)]
        ]
      }
    })
  }
})


L.Feature['G*T*Y-----'] = (feature, options) => {
  options.labels = () => [{
    placement: ({ envelope }) => line(envelope[1]).point(0.5),
    lines: ['B'],
    'font-size': 18,
    angle: ({ envelope }) => line(envelope[1]).angle() + 90
  }]

  return new BYS(feature, options)
}

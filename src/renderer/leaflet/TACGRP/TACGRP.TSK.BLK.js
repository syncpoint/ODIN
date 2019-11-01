import L from 'leaflet'
import { line } from '../features/geo-helper'
import { shape } from '../features/shape'
import '../features/Corridor2Point'

const BLK = L.TACGRP.Corridor2Point.extend({
  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ center, envelope }) => [center, envelope[0]]
    })
  }
})

L.Feature['G*T*B-----'] = (feature, options) => {
  options.labels = () => [{
    placement: ({ center }) => line(center).point(0.5),
    lines: ['B'],
    'font-size': 18,
    angle: ({ center }) => line(center).angle()
  }]

  return new BLK(feature, options)
}

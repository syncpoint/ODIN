import L from 'leaflet'
import { line } from './shapes/geo-helper'
import { svgBuilder } from './shapes/svg-builder'
import '../Corridor2Point'
import './Corridor'


L.Feature['G*T*B-----'] = L.TACGRP.Corridor.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    return svgBuilder(group, options, {
      points: ({ center, envelope }) => [center, envelope[0]]
    })
  },

  _labels () {
    return [{
      placement: ({ center }) => line(center).point(0.5),
      alignment: 'center', // default
      lines: ['B'],
      'font-size': 18,
      angle: ({ center }) => line(center).angle()
    }]
  }
})

import L from 'leaflet'
import { line } from './shapes/geo-helper'
import { svgBuilder } from './shapes/svg-builder'
import '../Corridor2Point'
import './Corridor'


L.Feature['G*T*B-----'] = L.TACGRP.Corridor.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    const builder = svgBuilder(options, {
      points: ({ center, envelope }) => [center, envelope[0]],
      style: name => options.stylesX[name],
      placements: ({ center }) => ({ center: line(center).point(0.5) }),
      labels: ({ center }) => [{
        placement: 'center',
        alignment: 'center', // default
        lines: ['B'],
        'font-size': 18,
        angle: line(center).angle()
      }]
    })

    return {
      attached: () => builder.attach(group),
      updateFrame: builder.updateFrame
    }
  }
})

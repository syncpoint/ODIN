/* eslint-disable */

import L from 'leaflet'
import { line } from './shapes/geo-helper'
import { svgBuilder } from './shapes/svg-builder'
import '../Corridor2Point'
import './Corridor'


L.Feature['G*T*B-----'] = L.TACGRP.Corridor.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    // TODO: add font info to style
    options.styles.clipping = 'mask'

    const points = ({ center, envelope }) => ({ points: [center, envelope[0]], closed: false })
    const style = name => options.stylesX[name]
    const placements = ({ center }) => ({ center: line(center).point(0.5) })
    const labels = ({ center }) => [{
        placement: 'center',
        alignment: 'center', // default
        lines: ['B'],
        'font-size': 18,
        angle: line(center).angle()
    }]

    const builder = svgBuilder(options, {
      points,
      style,
      placements,
      labels
    })

    builder.path('outline')
    builder.path('path')

    return {
      attached: () => builder.attach(group),
      updateFrame: builder.updateFrame
    }
  }
})

// L.Feature['G*T*B-----'] = L.Corridor2Point.extend({
//   path ({ A, B, B1, B2 }) {
//     return [[A, B], [B1, B2]]
//   },
//   label ({ A, B, initialBearing }) {
//     const distance = A.distanceTo(B)
//     const latlng = A.destinationPoint(distance / 2, initialBearing)
//     return { text: 'B', latlng, bearing: initialBearing }
//   }
// })

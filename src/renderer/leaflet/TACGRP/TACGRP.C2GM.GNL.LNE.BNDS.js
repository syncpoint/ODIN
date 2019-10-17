import L from 'leaflet'
import * as R from 'ramda'
import '../features/Polyline'
import echelons from '../features/echelons'
import { shape } from '../features/react-shape'
import { line } from '../features/geo-helper'
import { styles } from '../features/styles'

L.Feature['G*G*GLB---'] = L.TACGRP.Polyline.extend({


  /**
   *
   */
  _styles (feature) {
    const _styles = styles(feature)
    _styles.clipping = 'mask'
    return _styles
  },


  /**
   *
   */
  _setFeature (feature) {

    // Derive SVG from label description and add to label group:
    const ops = echelons[feature.properties.sidc[11]] || []
    this._glyph = () => {
      const glyph = ops.reduce((acc, description) => {
        const element = L.SVG.create(description.type)
        L.SVG.setAttributes(element)(description)
        acc.appendChild(element)
        return acc
      }, L.SVG.g({}))

      L.SVG.setAttributes(glyph)({
        'stroke-width': 4,
        'stroke': 'black',
        'fill': 'none'
      })

      return glyph
    }

    L.TACGRP.Polyline.prototype._setFeature.call(this, feature)
  },


  /**
   *
   */
  _shape (group, options) {
    return shape(group, options, {
      points: ({ points }) => [points]
    })
  },

  _labels () {
    return ({ points }) => R.aperture(2, points)
      .map(line)
      .map(line => ({ placement: line.point(0.5), angle: line.angle() }))
      .map(({ placement, angle }) => ({
        placement,
        angle,
        scale: 0.5,
        offset: L.point(-100, -178),
        glyph: this._glyph()
      }))
  }
})

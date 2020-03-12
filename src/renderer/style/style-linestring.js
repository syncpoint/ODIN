/* eslint-disable */

import * as R from 'ramda'
import { Style, Text, Stroke, Icon } from 'ol/style'
import { Point } from 'ol/geom'
import { defaultFont } from './style-font'
import defaultStyle from './style-default'
import echelonSource from './echelons'

const font = defaultFont()
const stroke = new Stroke({ color: 'white', width: 3 })
const vector = points => [points[1][1] - points[0][1], points[1][0] - points[0][0]]
const atan2 = delta => -1 * Math.atan2(delta[0], delta[1])
const normalizeAngle = x => x < 0 ? 2 * Math.PI + x : x
const segmentAngle = R.compose(normalizeAngle, atan2, vector)
const head = xs => xs[0]
const last = xs => xs[xs.length - 1]
const flip = α => α > Math.PI / 2 && α < 3 * Math.PI / 2


const labelStyle = lines => feature => {
  const xOffset = 20
  const points = feature.getGeometry().getCoordinates()
  const segments = R.aperture(2, points)
  const α1 = segmentAngle(head(segments))
  const αn = segmentAngle(last(segments))
  const text = lines(feature.getProperties()).join('\n')

  const textStyle = (textAlign, offsetX, rotation) => new Text({
    text,
    textAlign,
    offsetX,
    rotation,
    font,
    stroke
  })

  return [
    ...defaultStyle(feature),
    new Style({
      geometry: new Point(head(points)),
      text: textStyle(
        flip(α1) ? 'end' : 'start',
        flip(α1) ? xOffset : -xOffset,
        flip(α1) ? α1 - Math.PI : α1
      )
    }),
    new Style({
      geometry: new Point(last(points)),
      text: textStyle(
        flip(αn) ? 'start' : 'end',
        flip(αn) ? -xOffset : xOffset,
        flip(αn) ? αn - Math.PI : αn
      )
    })
  ]
}

const style = {
  // TACGRP.C2GM.GNL.LNE.PHELNE
  'G-G-GLP---': [
    labelStyle(props => (['10 2000Z', 'LL', props.t ? `(PL ${props.t})` : '']))
  ],

  // TACGRP.C2GM.GNL.LNE.BNDS
  'G-G-GLB---': [
    feature => {
      const { t, t1, sidc } = feature.getProperties()
      // GFGPGLB----I**X
      const yOffset = 20
      const geometry = feature.getGeometry()
      const cut = 0.5
      const center = new Point(geometry.getCoordinateAt(cut))
      const α = segmentAngle([geometry.getCoordinateAt(cut - 0.05), geometry.getCoordinateAt(cut + 0.05)])

      return [
        ...defaultStyle(feature),
        new Style({
          text: new Text({
            font,
            stroke,
            text: t,
            offsetY: flip(α) ? yOffset : -yOffset,
            rotation: flip(α) ? α - Math.PI : α
          })
        }),
        new Style({
          text: new Text({
            font,
            stroke,
            text: t1,
            offsetY: flip(α) ? -yOffset : yOffset,
            rotation: flip(α) ? α - Math.PI : α
          })
        }),
        new Style({
          geometry: center,
          image: new Icon({
            rotation: α,
            scale: 0.5,
            src: echelonSource(sidc[11])
          })
        })
      ]
    }
  ],

  // TACGRP.C2GM.OFF.LNE.LD
  'G-G-OLT---': [
    labelStyle(props => (['LD', props.t ? `(PL ${props.t})` : '']))
  ]
}

export default {
  style,
  defaultStyle: [defaultStyle]
}

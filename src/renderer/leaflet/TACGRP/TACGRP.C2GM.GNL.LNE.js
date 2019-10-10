import L from 'leaflet'
import '../features/Polyline'
import { line } from '../features/geo-helper'
import { styles, strokeDashArray } from '../features/styles'

const fontSize = 14

const segments = points => {
  const n = points.length
  return [
    line([points[0], points[1]]),
    line([points[n - 2], points[n - 1]])
  ]
}

const labeledLine = lines => L.TACGRP.Polyline.extend({

  _labels (feature) {
    return ({ points }) => {
      const s = segments(points)
      return [
        {
          lines: lines(feature),
          anchor: 'start',
          placement: 'start',
          'font-size': fontSize,
          angle: s[0].angle
        },
        {
          lines: lines(feature),
          anchor: 'end',
          placement: 'end',
          'font-size': fontSize,
          angle: s[1].angle
        }
      ]
    }
  }
})

L.Feature['G*G*DLF---'] = labeledLine(() => (['FEBA']))
L.Feature['G*G*GLF---'] = labeledLine(feature => ([`${feature.properties.n || ''}`, 'FLOT']))
L.Feature['G*G*GLC---'] = labeledLine(feature => ([`${feature.properties.n || ''}`]))
L.Feature['G*G*GLP---'] = labeledLine(feature => ([`PL ${feature.properties.t || ''}`]))
L.Feature['G*G*GLL---'] = labeledLine(feature => (['LL', feature.properties.t ? `(PL ${feature.properties.t})` : '']))
L.Feature['G*G*OLF---'] = labeledLine(feature => (['FINAL CL', feature.properties.t ? `(PL ${feature.properties.t})` : '']))
L.Feature['G*G*OLL---'] = labeledLine(feature => (['LOA', feature.properties.t ? `(PL ${feature.properties.t})` : '']))
L.Feature['G*G*OLT---'] = labeledLine(feature => (['LD', feature.properties.t ? `(PL ${feature.properties.t})` : '']))
L.Feature['G*G*OLC---'] = labeledLine(feature => (['LD/LC', feature.properties.t ? `(PL ${feature.properties.t})` : '']))

L.Feature['G*G*OLP---'] = labeledLine(feature =>
  (['PLD', feature.properties.t ? `(PL ${feature.properties.t})` : ''])).extend({
  _styles (feature) {
    const _styles = styles(feature)
    _styles.outline['stroke-dasharray'] = strokeDashArray()
    _styles.path['stroke-dasharray'] = strokeDashArray()
    return _styles
  }
})

L.Feature['G*G*SLR---'] = labeledLine(feature => (['RL', feature.properties.t ? `(PL ${feature.properties.t})` : '']))
L.Feature['G*F*LCN---'] = labeledLine(feature => (['NFL', feature.properties.t ? `(PL ${feature.properties.t})` : '']))

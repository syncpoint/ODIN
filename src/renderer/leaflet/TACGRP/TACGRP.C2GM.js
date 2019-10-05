import L from 'leaflet'
import './PolygonArea'
import './Polyline'
import { styles } from './styles'
import './TACGRP.C2GM.GNL.ARS.SRHARA'
import './TACGRP.C2GM.GNL.LNE.BNDS'
import './TACGRP.C2GM.OFF.LNE.AXSADV.ABN'
import './TACGRP.C2GM.OFF.LNE.AXSADV.AVN'
import './TACGRP.C2GM.OFF.LNE.AXSADV.GRD.MANATK'
import './TACGRP.C2GM.OFF.LNE.AXSADV.GRD.SUPATK'

const effectiveLine = properties => {
  if (!properties.w && !properties.w1) return null
  if (properties.w && properties.w1) return `${properties.w}-${properties.w1}`
  if (properties.w) return `${properties.w}`
  if (properties.w1) return `${properties.w1}`
}

const centerLabel = lines => [{ placement: 'center', alignment: 'center', lines }]
const centerLabelLeft = lines => [{ placement: 'center', alignment: 'left', lines }]

const axisLabelsNSEW = line => ['north', 'south', 'east', 'west'].map(placement => ({
  placement,
  lines: [line]
}))

const axisLabelsEW = line => ['east', 'west'].map(placement => ({
  placement,
  lines: [line]
}))

const namedArea = name => (feature, options) => {
  options.styles = styles
  options.labels = feature => centerLabel([`<bold>${name}</bold>`, feature.properties.t])
  return new L.TACGRP.PolygonArea(feature, options)
}

const titledArea = (feature, options) => {
  options.styles = styles
  options.labels = feature => centerLabel([feature.properties.t])
  return new L.TACGRP.PolygonArea(feature, options)
}

// Generic/default area:
// FIXME: search and replace
L.TACGRP.PolygonAreaTitled = titledArea

// TACGRP.C2GM.GNL.ARS.ABYARA - ASSEMBLY AREA
L.Feature['G*G*GAA---'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => {
    const labels = centerLabel([`<bold>AA</bold>`, feature.properties.t])
    if (feature.properties.n) return labels.concat(axisLabelsEW('ENY'))
    else return labels
  }

  return new L.TACGRP.PolygonArea(feature, options)
}

L.Feature['G*G*GAE---'] = namedArea('EA')
L.Feature['G*G*GAD---'] = namedArea('DZ')
L.Feature['G*G*GAX---'] = namedArea('EZ')
L.Feature['G*G*GAP---'] = namedArea('PZ')
L.Feature['G*G*GAL---'] = namedArea('LZ')
L.Feature['G*G*OAK---'] = namedArea('ATK')
L.Feature['G*G*OAO---'] = namedArea('OBJ')
L.Feature['G*G*SAO---'] = namedArea('AO')
L.Feature['G*G*SAN---'] = namedArea('NAI')
L.Feature['G*G*SAT---'] = namedArea('TAI')

// TODO: needs echelon
L.Feature['G*G*DAB---'] = titledArea
L.Feature['G*G*DABP--'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => {
    const labels = centerLabel([
      feature.properties.t ? `(P) ${feature.properties.t}` : '(P)',
      effectiveLine(feature.properties)
    ])
    if (feature.properties.n) return labels.concat(axisLabelsEW('ENY'))
    else return labels
  }

  return new L.TACGRP.PolygonArea(feature, options)
}

// ENGAGEMENT AREA (DEFENSE)
L.Feature['G*G*DAE---'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => centerLabel([ feature.properties.t ? `EA ${feature.properties.t}` : 'EA' ])
  return new L.TACGRP.PolygonArea(feature, options)
}

// TACGRP.FSUPP.ARS.ARATGT.SMK - SMOKE
L.Feature['G*F*ATS---'] = (feature, options) => {
  options.styles = styles
  options.labels = feature => centerLabel([
    '<bold>SMOKE</bold>',
    effectiveLine(feature.properties)
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

L.Feature['G*S*AR----'] = namedArea('FARP')

// NOTE: No distinction: IRREGULAR/RECTANGULAR, but no CIRCULAR
L.Feature['G*F*ACFI--'] = (feature, options) => {
  options.styles = styles
  options.labels = feature => centerLabel([
    '<bold>FFA</bold>',
    feature.properties.t,
    effectiveLine(feature.properties)
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

L.Feature['G*F*ACFR--'] = L.Feature['G*F*ACFI--']

L.Feature['G*F*ACNI--'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), fill: 'diagonal', clipping: 'backdrop' })
  options.labels = feature => centerLabel([
    '<bold>NFA</bold>',
    feature.properties.t,
    effectiveLine(feature.properties)
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

L.Feature['G*F*ACNR--'] = L.Feature['G*F*ACNI--']
L.Feature['G*F*ACRI--'] = (feature, options) => {
  options.styles = styles
  options.labels = feature => centerLabel([
    '<bold>RFA</bold>',
    feature.properties.t,
    effectiveLine(feature.properties)
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

L.Feature['G*F*ACRR--'] = L.Feature['G*F*ACRI--']

L.Feature['G*M*OFA---'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = _ => axisLabelsNSEW('M')
  return new L.TACGRP.PolygonArea(feature, options)
}

// GENERAL AREA
L.Feature['G*G*GAG---'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => {
    const labels = centerLabel([feature.properties.t])
    if (feature.properties.n) return labels.concat(axisLabelsEW('ENY'))
    else return labels
  }

  return new L.TACGRP.PolygonArea(feature, options)
}

L.Feature['G*M*OU----'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => centerLabel([feature.properties.t]).concat(axisLabelsEW('UXO'))
  return new L.TACGRP.PolygonArea(feature, options)
}

L.Feature['G*S*AD----'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => centerLabel([
    '<bold>DETAINEE</bold>',
    '<bold>HOLDING</bold>',
    '<bold>AREA</bold>',
    feature.properties.t
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

// AIRSPACE COORDINATION AREA, IRREGULAR
L.Feature['G*F*ACAI--'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'backdrop' })
  options.labels = feature => centerLabelLeft([
    '<bold>ACA</bold>',
    feature.properties.t,
    feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
    feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
    feature.properties.h ? `GRIDS: ${feature.properties.h}` : null,
    feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
    feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

// Limited Access Area
L.Feature['G*G*GAY---'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), fill: 'diagonal', clipping: 'backdrop' })
  options.labels = feature => centerLabel([feature.properties.h])
  return new L.TACGRP.PolygonArea(feature, options)
}

const missleEnganementZone = name => (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => centerLabelLeft([
    `<bold>${name}</bold>`,
    feature.properties.t,
    feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
    feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
    feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
    feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}


L.Feature['G*G*AAM---'] = missleEnganementZone('MEZ')
L.Feature['G*G*AAML--'] = missleEnganementZone('LOMEZ')
L.Feature['G*G*AAMH--'] = missleEnganementZone('HIMEZ')

// Weapons Free Zone
L.Feature['G*G*AAW---'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), fill: 'diagonal', clipping: 'backdrop' })
  options.labels = feature => centerLabelLeft([
    '<bold>WFZ</bold>',
    feature.properties.t,
    feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
    feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

// TACGRP.C2GM.AVN.ARS.ROZ - RESTRICTED OPERATIONS ZONE (ROZ)
L.Feature['G*G*AAR---'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => centerLabelLeft([
    '<bold>ROZ</bold>',
    feature.properties.t,
    feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
    feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
    feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
    feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

// TACGRP.C2GM.AVN.ARS.SHRDEZ - SHORT-RANGE AIR DEFENSE ENGAGEMENT ZONE (SHORADEZ)
L.Feature['G*G*AAF---'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => centerLabelLeft([
    '<bold>SHORADEZ</bold>',
    feature.properties.t,
    feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
    feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
    feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
    feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

// TACGRP.CSS.ARA.EPWHA - ENEMY PRISONER OF WAR (EPW) HOLDING AREA
L.Feature['G*S*AE----'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => centerLabel([
    '<bold>EPW</bold>',
    '<bold>HOLDING</bold>',
    '<bold>AREA</bold>',
    feature.properties.t
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

L.Feature['G*S*AH----'] = (feature, options) => {
  options.styles = feature => ({ ...styles(feature), clipping: 'mask' })
  options.labels = feature => centerLabel([
    '<bold>REFUGEE</bold>',
    '<bold>HOLDING</bold>',
    '<bold>AREA</bold>',
    feature.properties.t
  ])

  return new L.TACGRP.PolygonArea(feature, options)
}

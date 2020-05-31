/* eslint-disable */
import defaultStyle from './style-default'
import { nsewLabel, centerLabel, nwLabel, northLabel, ewLabels } from './labels-polygon'
import { parameterized } from '../../components/SIDC'

const optLine = p => p ? p : null

const templates = {}

// TACGRP.FSUPP.ARS.C2ARS.TBA
// c: title / t
// nw: w / w1
templates['G*F*ACBI--'] = title => [
  nwLabel(props => [props.w, props.w1]),
  centerLabel(props => [title, props.t])
]

// TACGRP.FSUPP.ARS.C2ARS.ACA.IRR
// c: title / t / x / x1 / w / w1
templates['G*F*ACAI--'] = title => [
  centerLabel(props => [
    title,
    props.t ? props.t : null,
    props.x ? 'MIN ALT: ' + props.x : null,
    props.x1 ? 'MAX ALT: ' + props.x1 : null,
    props.w ? 'TIME FROM: ' + props.w : null,
    props.w1 ? 'TIME TO: ' + props.w1 : null
  ])
]

// TACGRP.FSUPP.ARS.C2ARS.FFA.IRR
// c: title / t / w - w1
templates['G*F*ACFI--'] = title => {
  const W = props => (props.w && props.w1)
    ? props.w + '-' + props.w1
    : props.w || props.w1
  return [centerLabel(props => [title, props.t, W(props)])]
}

// TACGRP.FSUPP.ARS.C2ARS.FSA
// c: title t
// nw: w / w1
templates['G*F*ACSI--'] = title => [
  nwLabel(props => [props.w, props.w1]),
  centerLabel(props => [title + (props.t ? ' ' + props.t : '')])
]

// TACGRP.FSUPP.ARS.C2ARS.TGMF
// c: title
templates['G*F*ACT---'] = title => [centerLabel(() => [title])]

// TACGRP.FSUPP.ARS.ARATGT
// c: t
templates['G*F*AT----'] = [centerLabel(props => [props.t])]

// TACGRP.FSUPP.ARS.ARATGT.SGTGT
// n: t
templates['G*F*ATG---'] = [northLabel(props => [props.t])]

// TACGRP.FSUPP.ARS.ARATGT.SMK
// c: title / w - w1
templates['G*F*ATS---'] = title => {
  const W = props => (props.w && props.w1)
    ? props.w + '-' + props.w1
    : props.w || props.w1
  return [centerLabel(props => [title, W(props)])]
}

// TACGRP.C2GM.AVN.ARS.WFZ
// c: title / t / w / w1
templates['G*F*AAW---'] = title => [
  centerLabel(props => [
    title,
    props.t ? props.t : null,
    props.w ? 'TIME FROM: ' + props.w : null,
    props.w1 ? 'TIME TO: ' + props.w1 : null
  ])
]

// TACGRP.C2GM.DEF.ARS.BTLPSN
// c: title? t
// ew: 'ENY'
templates['G*G*DAB---'] = title => [
  centerLabel(props => [title ? title + ' ' + (props.t || '') : props.t]),
  ewLabels(props => [props.n])
]

// TACGRP.C2GM.DEF.ARS.EMTARA
// c: title t
templates['G*G*DAE---'] = title => [
  centerLabel(props => [title + (props.t ? ' ' + props.t : '')])
]

// TACGRP.C2GM.GNL.ARS.ABYARA
// c: title / t
// ew: 'ENY'
templates['G*G*GAA---'] = title => [
  centerLabel(props => [title, props.t]),
  ewLabels(props => [props.n])
]

// TACGRP.C2GM.GNL.ARS.LAARA
// c: h (additional information)
templates['G*G*GAY---'] = [
  centerLabel(props => [props.h])
]

// TACGRP.C2GM.OFF.ARS
// c: title / ... / t
templates['G*G*OAA---'] = titles => [
  centerLabel(props => [...titles, props.t])
]

// TACGRP.C2GM.SPL.ARA.NAI
// c: title / t
templates['G*G*GAA---'] = title => [
  centerLabel(props => [title, props.t])
]

const labels = {}
labels['G*F*ACBI--'] = templates['G*F*ACBI--']('TBA')
labels['G*F*ACAI--'] = templates['G*F*ACAI--']('ACA')
labels['G*F*ACDI--'] = templates['G*F*ACBI--']('DA')
labels['G*F*ACEI--'] = templates['G*F*ACBI--']('SENSOR ZONE')
labels['G*F*ACFI--'] = templates['G*F*ACFI--']('FFA')
labels['G*F*ACNI--'] = templates['G*F*ACFI--']('NFA') // TODO: fill pattern
labels['G*F*ACRI--'] = templates['G*F*ACFI--']('RFA')
labels['G*F*ACSI--'] = templates['G*F*ACSI--']('FSA')
labels['G*F*ACT---'] = templates['G*F*ACT---']('TGMF')
labels['G*F*ACVI--'] = templates['G*F*ACBI--']('TVAR')
labels['G*F*ACZI--'] = templates['G*F*ACBI--']('ZOR')
labels['G*F*AKBI--'] = templates['G*F*ACFI--']('BKB') // TODO: fill pattern
labels['G*F*AKPI--'] = templates['G*F*ACFI--']('PKB') // TODO: fill pattern
labels['G*F*AT----'] = templates['G*F*AT----']
labels['G*F*ATB---'] = templates['G*F*ACT---']('BOMB')
labels['G*F*ATG---'] = templates['G*F*ATG---']
labels['G*F*ATS---'] = templates['G*F*ATS---']('SMOKE')
labels['G*F*AZCI--'] = templates['G*F*ACBI--']('CENSOR ZONE')
labels['G*F*AZFI--'] = templates['G*F*ACBI--']('CF ZONE')
labels['G*F*AZII--'] = templates['G*F*ACBI--']('ATI ZONE')
labels['G*F*AZXI--'] = templates['G*F*ACBI--']('CFF ZONE')
labels['G*G*AAF---'] = templates['G*F*ACAI--']('SHORADEZ')
labels['G*G*AAH---'] = templates['G*F*ACAI--']('HIDACZ')
labels['G*G*AAM---'] = templates['G*F*ACAI--']('MEZ')
labels['G*G*AAMH--'] = templates['G*F*ACAI--']('HIMEZ')
labels['G*G*AAML--'] = templates['G*F*ACAI--']('LOMEZ')
labels['G*G*AAR---'] = templates['G*F*ACAI--']('ROZ')
labels['G*G*AAW---'] = templates['G*F*AAW---']('WFZ') // TODO: fill pattern
labels['G*G*DAB---'] = templates['G*G*DAB---']() // TODO: echelon (south)
labels['G*G*DABP--'] = templates['G*G*DAB---']('(P)') // TODO: echelon (south)
labels['G*G*DAE---'] = templates['G*G*DAE---']('EA')
labels['G*G*GAA---'] = templates['G*G*GAA---']('AA')
labels['G*G*GAD---'] = templates['G*G*GAA---']('DZ')
labels['G*G*GAE---'] = templates['G*G*GAA---']('EA')
// TODO: G*G*GAF---
labels['G*G*GAG---'] = templates['G*G*GAA---']()
labels['G*G*GAL---'] = templates['G*G*GAA---']('LZ')
labels['G*G*GAP---'] = templates['G*G*GAA---']('PZ')
labels['G*G*GAX---'] = templates['G*G*GAA---']('EZ')
labels['G*G*GAY---'] = templates['G*G*GAY---'] // TODO: fill pattern
// TODO: G*G*GAZ---
labels['G*G*OAA---'] = templates['G*G*OAA---'](['ASLT', 'PSN'])
labels['G*G*OAK---'] = templates['G*G*DAE---']('ATK')
labels['G*G*OAO---'] = templates['G*G*DAE---']('OBJ')
// TODO: G*G*PC----
// TODO: G*G*PM----
// TODO: G*GPPY----
// TODO: G*G*SAA---
// TODO: G*GPSAE---
labels['G*G*SAN---'] = templates['G*G*GAA---']('NAI')
labels['G*G*SAO---'] = templates['G*G*DAE---']('AO')
labels['G*G*SAT---'] = templates['G*G*GAA---']('TAI')
// TODO: G*MPNB----
// TODO: G*MPNC----
// TODO: G*MPNL----
// TODO: G*MPNR----


export const polygonStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const labelFns = labels[sidc] || []
  const styleFns = [defaultStyle, ...labelFns]
  return styleFns.flatMap(fn => fn(feature))
}

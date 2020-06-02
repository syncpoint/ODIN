import defaultStyle from './default-style'
import {
  nsewLabel as nsew,
  centerLabel as c,
  nwLabel as nw,
  northLabel as n,
  ewLabels as ew,
  footerLabel as f,
  nsLabels as ns
} from './polygon-labels'
import { parameterized } from '../../components/SIDC'

const when = s => fn => s ? fn(s) : null
const W = (w, w1) => (w && w1) ? w + '-' + w1 : w || w1
const ewENY = ew(({ n }) => [n])
const nsewM = nsew(() => ['M'])

const templates = {
  'G*F*ACBI--': title => [nw(({ w, w1 }) => [w, w1]), c(({ t }) => [title, t])],
  'G*F*ACFI--': title => [c(({ t, w, w1 }) => [title, t, W(w, w1)])],
  'G*F*ACSI--': title => [nw(({ w, w1 }) => [w, w1]), c(({ t }) => [title + (t ? ' ' + t : '')])],
  'G*F*ACT---': title => [c(() => [title])],
  'G*F*AT----': [c(({ t }) => [t])],
  'G*F*ATG---': [n(({ t }) => [t])],
  'G*F*ATS---': title => [c(({ w, w1 }) => [title, W(w, w1)])],
  'G*G*DAB---': title => [c(({ t }) => [title ? title + ' ' + (t || '') : t]), ewENY],
  'G*G*DAE---': title => [c(({ t }) => [title + (t ? ' ' + t : '')])],
  'G*G*GAA---': title => [c(({ t }) => [title, t]), ewENY],
  'G*G*GAY---': [c(({ h }) => [h])],
  'G*G*OAA---': titles => [c(({ t }) => [...titles, t])],
  'G*G*SAN---': title => [c(({ t }) => [title, t])],
  'G*G*PC----': [ewENY, ns(({ h }) => [h])],

  'G*F*ACAI--': title => [
    c(({ t, x, x1, w, w1 }) => [
      title, t,
      when(x)(s => `MIN ALT: ${s}`),
      when(x1)(s => `MAX ALT: ${s}`),
      when(w)(s => `TIME FROM: ${s}`),
      when(w1)(s => `TIME TO: ${s}`)
    ])
  ],

  'G*F*AAW---': title => [
    c(({ t, w, w1 }) => [
      title, t,
      when(w)(s => `TIME FROM: ${s}`),
      when(w1)(s => `TIME TO: ${s}`)
    ])
  ]
}

const labels = {
  'G*F*ACBI--': templates['G*F*ACBI--']('TBA'),
  'G*F*ACAI--': templates['G*F*ACAI--']('ACA'),
  'G*F*ACDI--': templates['G*F*ACBI--']('DA'),
  'G*F*ACEI--': templates['G*F*ACBI--']('SENSOR ZONE'),
  'G*F*ACFI--': templates['G*F*ACFI--']('FFA'),
  'G*F*ACNI--': templates['G*F*ACFI--']('NFA'), // TODO: fill pattern
  'G*F*ACRI--': templates['G*F*ACFI--']('RFA'),
  'G*F*ACSI--': templates['G*F*ACSI--']('FSA'),
  'G*F*ACT---': templates['G*F*ACT---']('TGMF'),
  'G*F*ACVI--': templates['G*F*ACBI--']('TVAR'),
  'G*F*ACZI--': templates['G*F*ACBI--']('ZOR'),
  'G*F*AKBI--': templates['G*F*ACFI--']('BKB'), // TODO: fill pattern
  'G*F*AKPI--': templates['G*F*ACFI--']('PKB'), // TODO: fill pattern
  'G*F*AT----': templates['G*F*AT----'],
  'G*F*ATB---': templates['G*F*ACT---']('BOMB'),
  'G*F*ATG---': templates['G*F*ATG---'],
  'G*F*ATS---': templates['G*F*ATS---']('SMOKE'),
  'G*F*AZCI--': templates['G*F*ACBI--']('CENSOR ZONE'),
  'G*F*AZFI--': templates['G*F*ACBI--']('CF ZONE'),
  'G*F*AZII--': templates['G*F*ACBI--']('ATI ZONE'),
  'G*F*AZXI--': templates['G*F*ACBI--']('CFF ZONE'),
  'G*G*AAF---': templates['G*F*ACAI--']('SHORADEZ'),
  'G*G*AAH---': templates['G*F*ACAI--']('HIDACZ'),
  'G*G*AAM---': templates['G*F*ACAI--']('MEZ'),
  'G*G*AAMH--': templates['G*F*ACAI--']('HIMEZ'),
  'G*G*AAML--': templates['G*F*ACAI--']('LOMEZ'),
  'G*G*AAR---': templates['G*F*ACAI--']('ROZ'),
  'G*G*AAW---': templates['G*F*AAW---']('WFZ'), // TODO: fill pattern
  'G*G*DAB---': templates['G*G*DAB---'](), // TODO: echelon (south)
  'G*G*DABP--': templates['G*G*DAB---']('(P)'), // TODO: echelon (south)
  'G*G*DAE---': templates['G*G*DAE---']('EA'),
  'G*G*GAA---': templates['G*G*GAA---']('AA'),
  'G*G*GAD---': templates['G*G*GAA---']('DZ'),
  'G*G*GAE---': templates['G*G*GAA---']('EA'),
  'G*G*GAF---': [ewENY],
  'G*G*GAG---': templates['G*G*GAA---'](),
  'G*G*GAL---': templates['G*G*GAA---']('LZ'),
  'G*G*GAP---': templates['G*G*GAA---']('PZ'),
  'G*G*GAX---': templates['G*G*GAA---']('EZ'),
  'G*G*GAY---': templates['G*G*GAY---'], // TODO: fill pattern
  'G*G*GAZ---': [ewENY],
  'G*G*OAA---': templates['G*G*OAA---'](['ASLT', 'PSN']),
  'G*G*OAK---': templates['G*G*DAE---']('ATK'),
  'G*G*OAO---': templates['G*G*DAE---']('OBJ'),
  'G*G*PC----': templates['G*G*PC----'],
  'G*G*PM----': [nsewM], // TODO: 'ENY'
  'G*G*PY----': [nsewM], // TODO: 'ENY', 'X'
  'G*G*SAA---': [f(({ t }) => ['AIRHEAD LINE', `(PL${t ? (' ' + t) : ''})`])],
  'G*G*SAE---': [ewENY],
  'G*G*SAN---': templates['G*G*SAN---']('NAI'),
  'G*G*SAO---': templates['G*G*DAE---']('AO'),
  'G*G*SAT---': templates['G*G*SAN---']('TAI'),
  'G*M*OFA---': [nsewM],
  'G*M*OU----': [ew(() => ['UXO'])],
  'G*M*OGF---': templates['G*F*ACFI--']('FREE'),
  'G*M*OGR---': templates['G*F*ACFI--'](),
  'G*M*OGZ---': templates['G*F*AT----'],
  'G*M*SP----': templates['G*F*AT----'], // TODO: echelon (south)
  'G*S*AD----': templates['G*G*OAA---'](['DETAINEE', 'HOLDING', 'AREA']),
  'G*S*AE----': templates['G*G*OAA---'](['EPW', 'HOLDING', 'AREA']),
  'G*S*AH----': templates['G*G*OAA---'](['REFUGEE', 'HOLDING', 'AREA']),
  'G*S*AR----': templates['G*G*GAA---'](['FARP']),
  'G*S*ASB---': templates['G*G*SAN---'](['BSA']),
  'G*S*ASD---': templates['G*G*SAN---'](['DSA']),
  'G*S*ASR---': templates['G*G*SAN---'](['RSA'])
}

// TODO: G*MPNB----, G*MPNC----, G*MPNL----, G*MPNR----, G*MPOFD---

export const polygonStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const labelFns = labels[sidc] || []
  const styleFns = [defaultStyle, ...labelFns]
  return styleFns.flatMap(fn => fn(feature, resolution))
}

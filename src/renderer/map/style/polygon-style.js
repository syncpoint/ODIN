import * as R from 'ramda'
import * as geom from 'ol/geom'
import { parameterized } from '../../components/SIDC'
import * as L from './polygon-labels'
import { fills } from './polygon-fills'
import { styleFactory } from './default-style'
import { geometries } from './polygon-geometries'
import { symbolStyle } from './symbol-style'
import Feature from 'ol/Feature'

const when = s => fn => s ? fn(s) : null
const W = (w, w1) => (w && w1) ? w + '-' + w1 : w || w1
const ewENY = L.ew(({ n }) => [n])
const nsewM = L.nsew(() => ['M'])


const templates = {
  'G*F*ACBI--': title => [L.nw(({ w, w1 }) => [w, w1]), L.c(({ t }) => [title, t])],
  'G*F*ACFI--': title => [L.c(({ t, w, w1 }) => [title, t, W(w, w1)])],
  'G*F*ACSI--': title => [L.nw(({ w, w1 }) => [w, w1]), L.c(({ t }) => [title + (t ? ' ' + t : '')])],
  'G*F*ACT---': title => [L.c(() => [title])],
  'G*F*AT----': [L.c(({ t }) => [t])],
  'G*F*ATG---': [L.n(({ t }) => [t])],
  'G*F*ATS---': title => [L.c(({ w, w1 }) => [title, W(w, w1)])],
  'G*G*DAB---': title => [L.c(({ t }) => [title ? title + ' ' + (t || '') : t]), ewENY],
  'G*G*DAE---': title => [L.c(({ t }) => [title + (t ? ' ' + t : '')])],
  'G*G*GAA---': title => [L.c(({ t }) => [title, t]), ewENY],
  'G*G*GAY---': [L.c(({ h }) => [h])],
  'G*G*OAA---': titles => [L.c(({ t }) => [...titles, t])],
  'G*G*SAN---': title => [L.c(({ t }) => [title, t])],
  'G*G*PC----': [ewENY, L.ns(({ h }) => [h])],

  'G*F*ACAI--': title => [
    L.c(({ t, x, x1, w, w1 }) => [
      title, t,
      when(x)(s => `MIN ALT: ${s}`),
      when(x1)(s => `MAX ALT: ${s}`),
      when(w)(s => `TIME FROM: ${s}`),
      when(w1)(s => `TIME TO: ${s}`)
    ])
  ],

  'G*F*AAW---': title => [
    L.c(({ t, w, w1 }) => [
      title, t,
      when(w)(s => `TIME FROM: ${s}`),
      when(w1)(s => `TIME TO: ${s}`)
    ])
  ]
}

const labelFn = {
  'G*F*ACBI--': templates['G*F*ACBI--']('TBA'),
  'G*F*ACBR--': templates['G*F*ACBI--']('TBA'),
  'G*F*ACAI--': templates['G*F*ACAI--']('ACA'),
  'G*F*ACAR--': templates['G*F*ACAI--']('ACA'),
  'G*F*ACDI--': templates['G*F*ACBI--']('DA'),
  'G*F*ACDR--': templates['G*F*ACBI--']('DA'),
  'G*F*ACEI--': templates['G*F*ACBI--']('SENSOR ZONE'),
  'G*F*ACER--': templates['G*F*ACBI--']('SENSOR ZONE'),
  'G*F*ACFI--': templates['G*F*ACFI--']('FFA'),
  'G*F*ACFR--': templates['G*F*ACFI--']('FFA'),
  'G*F*ACNI--': templates['G*F*ACFI--']('NFA'),
  'G*F*ACNR--': templates['G*F*ACFI--']('NFA'),
  'G*F*ACPR--': [L.nsew(() => ['PAA'])],
  'G*F*ACRI--': templates['G*F*ACFI--']('RFA'),
  'G*F*ACRR--': templates['G*F*ACFI--']('RFA'),
  'G*F*ACSI--': templates['G*F*ACSI--']('FSA'),
  'G*F*ACSR--': templates['G*F*ACSI--']('FSA'),
  'G*F*ACT---': templates['G*F*ACT---']('TGMF'),
  'G*F*ACVI--': templates['G*F*ACBI--']('TVAR'),
  'G*F*ACVR--': templates['G*F*ACBI--']('TVAR'),
  'G*F*ACZI--': templates['G*F*ACBI--']('ZOR'),
  'G*F*ACZR--': templates['G*F*ACBI--']('ZOR'),
  'G*F*AKBI--': templates['G*F*ACFI--']('BKB'),
  'G*F*AKBR--': templates['G*F*ACFI--']('BKB'),
  'G*F*AKPI--': templates['G*F*ACFI--']('PKB'),
  'G*F*AKPR--': templates['G*F*ACFI--']('PKB'),
  'G*F*AT----': templates['G*F*AT----'],
  'G*F*ATR---': templates['G*F*AT----'],
  'G*F*ATB---': templates['G*F*ACT---']('BOMB'),
  'G*F*ATG---': templates['G*F*ATG---'],
  'G*F*ATS---': templates['G*F*ATS---']('SMOKE'),
  'G*F*AZCI--': templates['G*F*ACBI--']('CENSOR ZONE'),
  'G*F*AZCR--': templates['G*F*ACBI--']('CENSOR ZONE'),
  'G*F*AZFI--': templates['G*F*ACBI--']('CF ZONE'),
  'G*F*AZFR--': templates['G*F*ACBI--']('CF ZONE'),
  'G*F*AZII--': templates['G*F*ACBI--']('ATI ZONE'),
  'G*F*AZIR--': templates['G*F*ACBI--']('ATI ZONE'),
  'G*F*AZXI--': templates['G*F*ACBI--']('CFF ZONE'),
  'G*F*AZXR--': templates['G*F*ACBI--']('CFF ZONE'),
  'G*G*AAF---': templates['G*F*ACAI--']('SHORADEZ'),
  'G*G*AAH---': templates['G*F*ACAI--']('HIDACZ'),
  'G*G*AAM---': templates['G*F*ACAI--']('MEZ'),
  'G*G*AAMH--': templates['G*F*ACAI--']('HIMEZ'),
  'G*G*AAML--': templates['G*F*ACAI--']('LOMEZ'),
  'G*G*AAR---': templates['G*F*ACAI--']('ROZ'),
  'G*G*AAW---': templates['G*F*AAW---']('WFZ'),
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
  'G*G*GAY---': templates['G*G*GAY---'],
  'G*G*GAZ---': [ewENY],
  'G*G*OAA---': templates['G*G*OAA---'](['ASLT', 'PSN']),
  'G*G*OAK---': templates['G*G*DAE---']('ATK'),
  'G*G*OAO---': templates['G*G*DAE---']('OBJ'),
  'G*G*PC----': templates['G*G*PC----'],
  'G*G*PM----': [nsewM], // TODO: 'ENY'
  'G*G*PY----': [nsewM], // TODO: 'ENY', 'X'
  'G*G*SAA---': [L.f(({ t }) => ['AIRHEAD LINE', `(PL${t ? (' ' + t) : ''})`])],
  'G*G*SAE---': [ewENY],
  'G*G*SAN---': templates['G*G*SAN---']('NAI'),
  'G*G*SAO---': templates['G*G*DAE---']('AO'),
  'G*G*SAT---': templates['G*G*SAN---']('TAI'),
  'G*M*OFA---': [nsewM],
  'G*M*OU----': [L.ew(() => ['UXO'])],
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


const embeddedSymbols = {
  'G*M*NR----': { sidc: 'G-MPNZ----' },
  'G*M*NB----': { sidc: 'G-MPNEB---' },
  'G*M*NC----': { sidc: 'G-MPNEC---' }
}

export const polygonStyle = mode => (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const geometry = feature.getGeometry()
  const ring = geometry.getLinearRing()
  const coordinates = ring.getCoordinates()
  if (!ring || !coordinates || !coordinates.length) return []

  const simplified = ((mode) => {
    if (mode === 'selected') return geometry
    if (coordinates.length < 100) return geometry
    else return geometry.simplify(resolution)
  })(mode)

  const factory = styleFactory({ mode, feature, resolution })(R.identity)
  const firstPoint = () => new geom.Point(simplified.getFirstCoordinate())

  const labels = () => {
    if (!factory.showLabels()) return []
    const label = fn => fn(L.placements(simplified))(feature.getProperties())
    return (labelFn[sidc] || []).flatMap(label)
  }

  /* some polygons do have an embedded point symbol */
  const embedded = () => {
    const symbol = embeddedSymbols[sidc]
    if (!symbol || !symbol.sidc) return []

    const embeddedFeature = new Feature({
      geometry: geometry.getInteriorPoint()
    })
    embeddedFeature.set('sidc', symbol.sidc)

    const stylezz = symbolStyle(mode)(embeddedFeature, resolution)
    stylezz[0].setGeometry(geometry.getInteriorPoint())
    return stylezz
  }

  const fill = fills[sidc] && fills[sidc]({ styles: factory })
  const options = { feature, geometry: simplified, resolution, styles: factory, fill }

  const geometryStyle = geometries[sidc]
    ? geometries[sidc](options)
    : [factory.solidLine(simplified, { fill })]


  return [
    ...(mode === 'multi' ? factory.handles(firstPoint()) : []),
    labels(),
    embedded(),
    ...geometryStyle
  ].flat()
}

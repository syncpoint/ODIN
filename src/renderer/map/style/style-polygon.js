import defaultStyle from './style-default'
import { nsewLabel, centerLabel, nwLabel, northLabel, ewLabels, footerLabel, nsLabels } from './labels-polygon'
import { parameterized } from '../../components/SIDC'


const templates = {}

templates['G*F*ACBI--'] = title => [
  nwLabel(props => [props.w, props.w1]),
  centerLabel(props => [title, props.t])
]

templates['G*F*ACAI--'] = title => [
  centerLabel(props => [
    title,
    props.t,
    props.x ? 'MIN ALT: ' + props.x : null,
    props.x1 ? 'MAX ALT: ' + props.x1 : null,
    props.w ? 'TIME FROM: ' + props.w : null,
    props.w1 ? 'TIME TO: ' + props.w1 : null
  ])
]

templates['G*F*ACFI--'] = title => {
  const W = props => (props.w && props.w1)
    ? props.w + '-' + props.w1
    : props.w || props.w1
  return [centerLabel(props => [title, props.t, W(props)])]
}

templates['G*F*ACSI--'] = title => [
  nwLabel(props => [props.w, props.w1]),
  centerLabel(props => [title + (props.t ? ' ' + props.t : '')])
]

templates['G*F*ATS---'] = title => {
  const W = props => (props.w && props.w1)
    ? props.w + '-' + props.w1
    : props.w || props.w1
  return [centerLabel(props => [title, W(props)])]
}

templates['G*F*AAW---'] = title => [
  centerLabel(props => [
    title,
    props.t ? props.t : null,
    props.w ? 'TIME FROM: ' + props.w : null,
    props.w1 ? 'TIME TO: ' + props.w1 : null
  ])
]

templates['G*G*DAB---'] = title => [
  centerLabel(props => [title ? title + ' ' + (props.t || '') : props.t]),
  ewLabels(props => [props.n])
]

templates['G*F*ACT---'] = title => [centerLabel(() => [title])]
templates['G*F*AT----'] = [centerLabel(props => [props.t])]
templates['G*F*ATG---'] = [northLabel(props => [props.t])]
templates['G*G*DAE---'] = title => [centerLabel(props => [title + (props.t ? ' ' + props.t : '')])]
templates['G*G*GAA---'] = title => [centerLabel(props => [title, props.t]), ewLabels(props => [props.n])]
templates['G*G*GAY---'] = [centerLabel(props => [props.h])]
templates['G*G*OAA---'] = titles => [centerLabel(props => [...titles, props.t])]
templates['G*G*SAN---'] = title => [centerLabel(props => [title, props.t])]
templates['G*G*GAF---'] = [ewLabels(props => [props.n])]
templates['G*G*PC----'] = [ewLabels(props => [props.n]), nsLabels(props => [props.h])]

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
labels['G*G*GAF---'] = templates['G*G*GAF---']
labels['G*G*GAG---'] = templates['G*G*GAA---']()
labels['G*G*GAL---'] = templates['G*G*GAA---']('LZ')
labels['G*G*GAP---'] = templates['G*G*GAA---']('PZ')
labels['G*G*GAX---'] = templates['G*G*GAA---']('EZ')
labels['G*G*GAY---'] = templates['G*G*GAY---'] // TODO: fill pattern
labels['G*G*GAZ---'] = templates['G*G*GAF---']
labels['G*G*OAA---'] = templates['G*G*OAA---'](['ASLT', 'PSN'])
labels['G*G*OAK---'] = templates['G*G*DAE---']('ATK')
labels['G*G*OAO---'] = templates['G*G*DAE---']('OBJ')
labels['G*G*PC----'] = templates['G*G*PC----']
labels['G*G*PM----'] = [nsewLabel(() => ['M'])] // TODO: 'ENY'
labels['G*G*PY----'] = [nsewLabel(() => ['M'])] // TODO: 'ENY', 'X'
labels['G*G*SAA---'] = [footerLabel(({ t }) => ['AIRHEAD LINE', `(PL${t ? (' ' + t) : ''})`])]
labels['G*G*SAE---'] = templates['G*G*GAF---']
labels['G*G*SAN---'] = templates['G*G*SAN---']('NAI')
labels['G*G*SAO---'] = templates['G*G*DAE---']('AO')
labels['G*G*SAT---'] = templates['G*G*SAN---']('TAI')
labels['G*M*OFA---'] = [nsewLabel(() => ['M'])]
labels['G*M*OU----'] = [ewLabels(() => ['UXO'])]
labels['G*M*OGF---'] = templates['G*F*ACFI--']('FREE')
labels['G*M*OGR---'] = templates['G*F*ACFI--']()
labels['G*M*OGZ---'] = templates['G*F*AT----']
labels['G*M*SP----'] = templates['G*F*AT----'] // TODO: echelon (south)
labels['G*S*AD----'] = templates['G*G*OAA---'](['DETAINEE', 'HOLDING', 'AREA'])
labels['G*S*AE----'] = templates['G*G*OAA---'](['EPW', 'HOLDING', 'AREA'])
labels['G*S*AH----'] = templates['G*G*OAA---'](['REFUGEE', 'HOLDING', 'AREA'])
labels['G*S*AR----'] = templates['G*G*GAA---'](['FARP'])
labels['G*S*ASB---'] = templates['G*G*SAN---'](['BSA'])
labels['G*S*ASD---'] = templates['G*G*SAN---'](['DSA'])
labels['G*S*ASR---'] = templates['G*G*SAN---'](['RSA'])

// TODO: G*MPNB----, G*MPNC----, G*MPNL----, G*MPNR----, G*MPOFD---

export const polygonStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const labelFns = labels[sidc] || []
  const styleFns = [defaultStyle, ...labelFns]
  return styleFns.flatMap(fn => fn(feature))
}

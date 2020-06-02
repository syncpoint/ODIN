import defaultStyle from './default-style'
import { parameterized } from '../../components/SIDC'
import {
  TOP, MIDDLE, BOTTOM, LEFT, RIGHT, START, END,
  label, lift, cloneLines
} from './line-labels'

const centerDTG = label({ textAlign: 0.5, verticalAlign: BOTTOM })(({ w, w1 }) => [w, w1])
const startDTG = label({ textAlign: START, verticalAlign: BOTTOM })(({ w, w1 }) => [w, w1])
const doubleDTG = lift(cloneLines(
  ({ w, w1 }) => [w, w1],
  [
    { textAlign: START, verticalAlign: BOTTOM },
    { textAlign: END, verticalAlign: BOTTOM }
  ]
))

const topTitle = title => label({ textAlign: 0.5, verticalAlign: TOP })(({ t }) => [t ? `${t} ${title}` : null])
const middleTitle = title => label({ textAlign: 0.5, verticalAlign: MIDDLE })(() => [title])

const doubleTitle = title => lift(cloneLines(
  ({ t }) => [t ? `${t} ${title}` : `${title}`],
  [
    { textAlign: START, verticalAlign: TOP },
    { textAlign: END, verticalAlign: TOP }
  ]
))

const lineEndsT1 = title => lift(cloneLines(
  ({ t1 }) => [t1 ? `${title} ${t1} ` : null],
  [
    { textAlign: LEFT, verticalAlign: MIDDLE },
    { textAlign: RIGHT, verticalAlign: MIDDLE }
  ]
))

const lineEndsT = title => lift(cloneLines(
  ({ t }) => [t ? `${title} ${t} ` : null],
  [
    { textAlign: LEFT, verticalAlign: MIDDLE },
    { textAlign: RIGHT, verticalAlign: MIDDLE }
  ]
))

const phaseLine = title => lift(cloneLines(
  ({ t }) => [title, t ? `(PL ${t})` : ''],
  [
    { textAlign: LEFT, verticalAlign: MIDDLE },
    { textAlign: RIGHT, verticalAlign: MIDDLE }
  ]
))

const labels = {
  'G*F*LCC---': [topTitle('CFL'), centerDTG],
  'G*F*LCF---': [doubleDTG, doubleTitle('FSCL'), lineEndsT1('PL')],
  'G*F*LCM---': [middleTitle('MFP'), startDTG],
  'G*F*LCN---': [phaseLine('NFL')],
  'G*F*LCR---': [doubleDTG, doubleTitle('RFL'), lineEndsT1('PL')],
  // TODO: G*G*DLF---
  // TODO: G*G*GLB---
  // TODO: G*G*GLC---
  // TODO: G*G*GLF---
  'G*G*GLL---': [phaseLine('LL')],
  'G*G*GLP---': [lineEndsT('PL')],
  'G*G*OLC---': [phaseLine('LD/LC')],
  'G*G*OLF---': [phaseLine('FINAL CL')]
}

export const lineStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const labelFns = labels[sidc] || []
  const styleFns = [defaultStyle, ...labelFns]
  return styleFns.flatMap(fn => fn(feature, resolution))
}

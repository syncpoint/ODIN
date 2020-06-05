import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as style from 'ol/style'
import { defaultFont } from './font'

/**
 * Horizontal and vertical label placement
 *
 * vertical/horizontal
 *
 *                 LEFT  START      <-- FRACTION -->    END  RIGHT
 * TOP                |  |                 |              |  |
 *                    |  |                 |              |  |
 * BASELINE           |  +-----------------|--------------+  |
 *                    |  P1                |              P2 |
 * BOTTOM             |  |                 |              |  |
 */

export const LEFT = 'LEFT'
export const START = 'START'
export const END = 'END'
export const RIGHT = 'RIGHT'
export const TOP = 'TOP'
export const MIDDLE = 'MIDDLE'
export const BOTTOM = 'BOTTOM'

const { PI: _PI } = Math
const _TWO_PI = 2 * _PI
const _HALF_PI = _PI / 2
const vector = points => [points[1][1] - points[0][1], points[1][0] - points[0][0]]
const atan2 = delta => -1 * Math.atan2(delta[0], delta[1])
const normalizeAngle = x => x < 0 ? _TWO_PI + x : x
const segmentAngle = R.compose(normalizeAngle, atan2, vector)
const head = xs => xs[0]
const last = xs => xs[xs.length - 1]

const defaultStroke = new style.Stroke({ color: 'white', width: 3 })

const flip = α => α > _HALF_PI && α < 3 * _HALF_PI
const vAlign = v => ({ verticalAlign }) => verticalAlign === v
const hAlign = v => ({ textAlign }) => textAlign === v

const textAlign = α => R.cond([
  [hAlign(LEFT), R.always(flip(α) ? 'end' : 'start')],
  [hAlign(END), R.always(flip(α) ? 'end' : 'start')],
  [hAlign(START), R.always(flip(α) ? 'start' : 'end')],
  [hAlign(RIGHT), R.always(flip(α) ? 'start' : 'end')],
  [R.T, R.always(null)]
])

const offsetX = α => R.cond([
  [hAlign(LEFT), R.always(flip(α) ? 15 : -15)],
  [hAlign(END), R.always(flip(α) ? 15 : -15)],
  [hAlign(START), R.always(flip(α) ? -15 : 15)],
  [hAlign(RIGHT), R.always(flip(α) ? -15 : 15)],
  [R.T, R.always(null)]
])

const offsetY = R.cond([
  [vAlign(TOP), R.always(-25)],
  [vAlign(BOTTOM), R.always(25)],
  [R.T, R.always(null)]
])

export const label = options => lines => feature => {
  const geometry = feature.getGeometry()
  const points = geometry.getCoordinates()
  const segments = R.aperture(2, points)

  const segment = fraction => [
    geometry.getCoordinateAt(fraction - 0.05),
    geometry.getCoordinateAt(fraction + 0.05)
  ]

  const alpha = R.cond([
    [hAlign(LEFT), R.always(segmentAngle(head(segments)))],
    [hAlign(START), R.always(segmentAngle(head(segments)))],
    [hAlign(END), R.always(segmentAngle(last(segments)))],
    [hAlign(RIGHT), R.always(segmentAngle(last(segments)))],
    [R.T, ({ textAlign }) => segmentAngle(segment(textAlign))]
  ])

  const point = R.cond([
    [hAlign(LEFT), R.always(geometry.getFirstCoordinate())],
    [hAlign(START), R.always(geometry.getFirstCoordinate())],
    [hAlign(END), R.always(geometry.getLastCoordinate())],
    [hAlign(RIGHT), R.always(geometry.getLastCoordinate())],
    [R.T, ({ textAlign }) => geometry.getCoordinateAt(textAlign)]
  ])

  const α = alpha(options)

  return new style.Style({
    geometry: new geom.Point(point(options)),
    text: new style.Text({
      text: lines(feature.getProperties()).filter(x => x).join('\n'),
      font: defaultFont,
      stroke: defaultStroke,
      rotation: flip(α) ? α - _PI : α,
      textAlign: textAlign(α)(options),
      offsetX: offsetX(α)(options),
      offsetY: offsetY(options)
    })
  })
}

// Combinators.

const lift = labels => feature => labels.map(label => label(feature))
const cloneLines = (lines, options) => options.map(options => label(options)(lines))
const cross = (textAlign, verticalAlign) => textAlign.map(textAlign => ({ textAlign, verticalAlign }))


// Templates.

const topTitle = title => label({ textAlign: 0.5, verticalAlign: TOP })(({ t }) => [`${title}${t ? ' ' + t : ''}`])
const topTitleReverse = title => label({ textAlign: 0.5, verticalAlign: TOP })(({ t }) => [t ? `${t} ${title}` : null])
const topTitleSubtitle = (title, subtitle) => label({ textAlign: 0.5, verticalAlign: TOP })(({ t }) => [`${title}${t ? ' ' + t : ''}`, subtitle])
const middleTitle = title => label({ textAlign: 0.5, verticalAlign: MIDDLE })(() => [title])
const doubleTitle = title => lift(cloneLines(({ t }) => [t ? `${t} ${title}` : `${title}`], cross([START, END], TOP)))
const centerDTG = label({ textAlign: 0.5, verticalAlign: BOTTOM })(({ w, w1 }) => [w, w1])
const startDTG = label({ textAlign: START, verticalAlign: BOTTOM })(({ w, w1 }) => [w, w1])
const doubleDTG = lift(cloneLines(({ w, w1 }) => [w, w1], cross([START, END], BOTTOM)))
const lineEndsT1 = title => lift(cloneLines(({ t1 }) => [t1 ? `${title} ${t1} ` : null], cross([LEFT, RIGHT], MIDDLE)))
const lineEndsT = title => lift(cloneLines(({ t }) => [t ? `${title} ${t} ` : null], cross([LEFT, RIGHT], MIDDLE)))
const phaseLine = title => lift(cloneLines(({ t }) => [title, t ? `(PL ${t})` : ''], cross([LEFT, RIGHT], MIDDLE)))

// Specific labels.

export const labels = {
  'G*F*LCC---': [topTitleReverse('CFL'), centerDTG],
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
  'G*G*OLF---': [phaseLine('FINAL CL')],
  'G*G*OLL---': [phaseLine('LOA')],
  'G*G*OLP---': [phaseLine('PLD')],
  'G*G*OLT---': [phaseLine('LD')],
  'G*G*SLH---': [phaseLine('HOLDING LINE')],
  'G*G*SLR---': [phaseLine('RL')],
  'G*S*LRA---': [topTitle('ASR')],
  'G*S*LRM---': [topTitle('MSR')],
  'G*S*LRO---': [topTitleSubtitle('MSR', '(ONE-WAY TRAFFIC)')],
  'G*S*LRT---': [topTitleSubtitle('MSR', '(ALTERNATING TRAFFIC)')],
  'G*S*LRW---': [topTitleSubtitle('MSR', '(TWO-WAY TRAFFIC)')]
}

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

export const lift = labels => feature => labels.map(label => label(feature))
export const cloneLines = (lines, options) => options.map(options => label(options)(lines))

export default feature => {

  return [
    label({ textAlign: LEFT, verticalAlign: TOP })(() => 'LEFT/TOP')(feature),
    label({ textAlign: START, verticalAlign: TOP })(() => 'START/TOP')(feature),
    label({ textAlign: 0.45, verticalAlign: TOP })(() => 'CENTER/TOP')(feature),
    label({ textAlign: END, verticalAlign: TOP })(() => 'END/TOP')(feature),
    label({ textAlign: RIGHT, verticalAlign: TOP })(() => 'RIGHT/TOP')(feature),

    label({ textAlign: LEFT, verticalAlign: MIDDLE })(() => 'LEFT/BASELINE')(feature),
    label({ textAlign: START, verticalAlign: MIDDLE })(() => 'START/BASELINE')(feature),
    label({ textAlign: 0.5, verticalAlign: MIDDLE })(() => 'CENTER/BASELINE')(feature),
    label({ textAlign: END, verticalAlign: MIDDLE })(() => 'END/BASELINE')(feature),
    label({ textAlign: RIGHT, verticalAlign: MIDDLE })(() => 'RIGHT/BASELINE')(feature),

    label({ textAlign: LEFT, verticalAlign: BOTTOM })(() => 'LEFT/BOTTOM')(feature),
    label({ textAlign: START, verticalAlign: BOTTOM })(() => 'START/BOTTOM')(feature),
    label({ textAlign: 0.55, verticalAlign: BOTTOM })(() => 'CENTER/BOTTOM')(feature),
    label({ textAlign: END, verticalAlign: BOTTOM })(() => 'END/BOTTOM')(feature),
    label({ textAlign: RIGHT, verticalAlign: BOTTOM })(() => 'RIGHT/BOTTOM')(feature)
  ]
}

import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as style from 'ol/style'
import { defaultStyle, whiteStroke, lineStyle, arc, biggerFont } from './default-style'
import { parameterized } from '../../components/SIDC'
import * as G from './geodesy'
import { closedArrowEnd, simpleArrowEnd, simpleCrossEnd } from './arrows'

const lastArcSegment = arc => [arc[arc.length - 2], arc[arc.length - 1]]

const flip = angle => (angle > 0 && angle <= 180) ? -1 : 1
const arcLabel = (C, radius, angle, text) => new style.Style({
  geometry: new geom.Point(G.fromLatLon(C.destinationPoint(radius, angle + 180))),
  text: new style.Text({
    text,
    rotation: (angle + flip(angle) * 90) / 180 * Math.PI,
    font: biggerFont,
    stroke: whiteStroke
  })
})

const styles = {}

styles['G*G*GAS---'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 3) return defaultStyle(feature)

  const [C, A, B] = points.map(G.toLatLon)
  const arrowA = closedArrowEnd([C, A], resolution)
  const arrowB = closedArrowEnd([C, B], resolution)
  const lines = [[C, arrowA[3]], [C, arrowB[3]], arrowA, arrowB]
  return lineStyle(feature, lines)
}

styles['G*T*E-----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)
  const innerArc = arc(C, radius * 0.8, angle, 330)
  const teeth = R.range(1, outerArc.length)
    .filter(i => i % 5 === 0)
    .map(i => [outerArc[i - 1], innerArc[i], outerArc[i + 1]])

  return lineStyle(feature, [
    outerArc,
    ...teeth,
    simpleArrowEnd(lastArcSegment(outerArc), resolution)
  ]).concat(arcLabel(C, radius, angle, 'I'))
}

styles['G*T*O-----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)

  return lineStyle(feature, [
    outerArc,
    ...simpleCrossEnd(lastArcSegment(outerArc), resolution)
  ]).concat(arcLabel(C, radius, angle, 'O'))
}

styles['G*T*Q-----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)
  const innerArc = arc(C, radius * 0.8, angle, 330)
  const spikes = R.range(1, outerArc.length - 2)
    .filter(i => i % 2 === 0)
    .map(i => [outerArc[i], innerArc[i]])

  return lineStyle(feature, [
    innerArc,
    ...spikes,
    simpleArrowEnd(lastArcSegment(innerArc), resolution)
  ]).concat(arcLabel(C, radius * 0.8, angle, 'R'))
}

styles['G*T*S-----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)

  return lineStyle(feature, [
    outerArc,
    simpleArrowEnd(lastArcSegment(outerArc), resolution)
  ]).concat(arcLabel(C, radius, angle, 'S'))
}

// TODO: label 'S'
styles['G*T*US----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 3) return defaultStyle(feature)

  const [C, A, B] = points.map(G.toLatLon)
  const arrowA = simpleArrowEnd([C, A], resolution)
  const arrowB = simpleArrowEnd([C, B], resolution)
  const lines = [[C, A], [C, B], arrowA, arrowB]
  return lineStyle(feature, lines)
}

styles['G*T*UG----'] = styles['G*T*US----'] // TODO: label 'G'
styles['G*T*UC----'] = styles['G*T*US----'] // TODO: label 'C'

export const multipointStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const geometryFns = styles[sidc] || defaultStyle
  return [geometryFns].flatMap(fn => fn(feature, resolution))
}

import * as R from 'ramda'
import * as geom from 'ol/geom'
import LatLon from 'geodesy/latlon-spherical.js'
import defaultStyle from './default-style'
import { K } from '../../../shared/combinators'
import { parameterized } from '../../components/SIDC'
import * as G from './geodesy'

const multiLineString = lines =>
  new geom.MultiLineString(lines.map(line => line.map(G.fromLatLon)))

const lineStyle = (feature, lines) => {
  const styles = defaultStyle(feature)

  // It is quite possible that feature's extent is too small
  // to construct a valid geometry. Use default style in this case.

  try {
    const geometry = multiLineString(lines)
    return K(styles)(xs => xs.forEach(s => s.setGeometry(geometry)))
  } catch (err) {
    return styles
  }
}

const closedArrowEnd = (line, resolution, widthFactor = 10, bearing = 145) => {
  const [finalBearing] = G.bearings(line).reverse()
  const arrowWidth = resolution * widthFactor
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  const I = LatLon.intersection(line[0], finalBearing, PA, finalBearing + 90)
  return [PA, line[1], PB, I, PA]
}

const simpleArrowEnd = (line, resolution, widthFactor = 10, bearing = 145) => {
  const [finalBearing] = G.bearings(line).reverse()
  const arrowWidth = resolution * widthFactor
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  return [PA, line[1], PB]
}

const simpleCrossEnd = (line, resolution, widthFactor = 10) => {
  const [finalBearing] = G.bearings(line).reverse()
  const arrowWidth = resolution * widthFactor
  const PA0 = line[1].destinationPoint(arrowWidth, finalBearing - 45)
  const PA1 = line[1].destinationPoint(-arrowWidth, finalBearing - 45)
  const PB0 = line[1].destinationPoint(arrowWidth, finalBearing + 45)
  const PB1 = line[1].destinationPoint(-arrowWidth, finalBearing + 45)
  return [[PA0, PA1], [PB0, PB1]]
}

const arc = (C, radius, angle, circumference, quads = 48) =>
  R.range(0, quads + 1)
    .map(i => angle + i * (circumference / quads))
    .map(offset => C.destinationPoint(radius, offset))


const geometries = {}

geometries['G*G*GAS---'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 3) return defaultStyle(feature)

  const [C, A, B] = points.map(G.toLatLon)
  const arrowA = closedArrowEnd([C, A], resolution)
  const arrowB = closedArrowEnd([C, B], resolution)
  const lines = [[C, arrowA[3]], [C, arrowB[3]], arrowA, arrowB]
  return lineStyle(feature, lines)
}

// TODO: label 'I'
geometries['G*T*E-----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)
  const innerArc = arc(C, radius * 0.8, angle, 330)
  const teeth = R.range(1, outerArc.length)
    .filter(i => i % 5 === 0)
    .map(i => [outerArc[i - 1], innerArc[i], outerArc[i + 1]])

  const n = outerArc.length
  const arrow = simpleArrowEnd([outerArc[n - 2], outerArc[n - 1]], resolution)
  return lineStyle(feature, [outerArc, ...teeth, arrow])
}

// TODO: label 'O'
geometries['G*T*O-----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)

  const n = outerArc.length
  const cross = simpleCrossEnd([outerArc[n - 2], outerArc[n - 1]], resolution)
  return lineStyle(feature, [outerArc, ...cross])
}

// TODO: label 'R'
geometries['G*T*Q-----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)
  const innerArc = arc(C, radius * 0.8, angle, 330)
  const spikes = R.range(1, outerArc.length - 2)
    .filter(i => i % 2 === 0)
    .map(i => [outerArc[i], innerArc[i]])

  const n = innerArc.length
  const arrow = simpleArrowEnd([innerArc[n - 2], innerArc[n - 1]], resolution)
  return lineStyle(feature, [innerArc, ...spikes, arrow])
}

// TODO: label 'S'
geometries['G*T*S-----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)

  const n = outerArc.length
  const arrow = simpleArrowEnd([outerArc[n - 2], outerArc[n - 1]], resolution)
  return lineStyle(feature, [outerArc, arrow])
}

// TODO: label 'S'
geometries['G*T*US----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 3) return defaultStyle(feature)

  const [C, A, B] = points.map(G.toLatLon)
  const arrowA = simpleArrowEnd([C, A], resolution)
  const arrowB = simpleArrowEnd([C, B], resolution)
  const lines = [[C, A], [C, B], arrowA, arrowB]
  return lineStyle(feature, lines)
}

geometries['G*T*UG----'] = geometries['G*T*US----'] // TODO: label 'G'
geometries['G*T*UC----'] = geometries['G*T*US----'] // TODO: label 'C'

const labels = {}

export const fanStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const labelFns = labels[sidc] || []
  const geometryFns = geometries[sidc] || defaultStyle
  return [geometryFns, ...labelFns].flatMap(fn => fn(feature, resolution))
}

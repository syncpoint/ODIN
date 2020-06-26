import * as R from 'ramda'
import { defaultStyle, lineStyle, arc, lineLabel, arcLabel } from './default-style'
import { parameterized } from '../../components/SIDC'
import * as G from './geodesy'
import { simpleArrowEnd, slashEnd } from './arrows'


const geometries = {}

geometries['G*M*OEB---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const bearing = G.initialBearing(linePoints)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const A = linePoints[0].destinationPoint(halfWidth, bearing + 90)
  const B = linePoints[0].destinationPoint(halfWidth, bearing - 90)
  return lineStyle(feature, [linePoints, [A, B]])
}

geometries['G*T*B-----'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const bearing = G.finalBearing(linePoints)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const A = linePoints[1].destinationPoint(halfWidth, bearing + 90)
  const B = linePoints[1].destinationPoint(halfWidth, bearing - 90)
  return lineStyle(feature, [linePoints, [A, B]]).concat(lineLabel(linePoints, 'B'))
}

geometries['G*T*C-----'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const [A1, A2] = G.translateLine(halfWidth, 90)(linePoints)
  const [B1, B2] = G.translateLine(halfWidth, -90)(linePoints)
  const slashA = slashEnd([A1, A2], -45, resolution)
  const slashB = slashEnd([B1, B2], 45, resolution)
  return lineStyle(feature, [[A1, B1], [A1, A2], [B1, B2], slashA, slashB])
    .concat(lineLabel(linePoints, 'C', 0))
}

geometries['G*T*H-----'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const [A1, A2] = G.translateLine(halfWidth, 90)(linePoints)
  const [B1, B2] = G.translateLine(halfWidth, -90)(linePoints)
  const slashA = slashEnd([A1, A2], 45, resolution)
  const slashB = slashEnd([B1, B2], -45, resolution)
  return lineStyle(feature, [[A1, B1], [A1, A2], [B1, B2], slashA, slashB])
    .concat(lineLabel(linePoints, 'B', 0))
}

geometries['G*T*J-----'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const bearing = G.finalBearing(linePoints)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const arrow = simpleArrowEnd(linePoints, resolution)
  const outerArc = arc(linePoints[1], halfWidth, bearing - 90, 180, 24)
  const innerArc = arc(linePoints[1], halfWidth * 0.8, bearing - 90, 180, 24)
  const spikes = R.range(0, outerArc.length)
    .filter(i => i % 2 === 0)
    .map(i => [outerArc[i], innerArc[i]])

  return lineStyle(feature, [linePoints, arrow, outerArc, ...spikes])
    .concat(arcLabel(linePoints[1], halfWidth, bearing - 180, 'C'))
}

const withdrawLike = text => (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const A = G.toLatLon(G.coordinates(point))
  const [bearing, width] = G.bearingLine([linePoints[0], A])
  const C = linePoints[0].destinationPoint(width / 2, bearing)
  const orientation = G.orientation(A, linePoints)
  const arcPoints = arc(C, width / 2, bearing, orientation * 180)
  const arrow = simpleArrowEnd(linePoints, resolution)
  return lineStyle(feature, [linePoints, arcPoints, arrow])
    .concat(lineLabel(linePoints, text))
}

geometries['G*T*L-----'] = withdrawLike('D')
geometries['G*T*M-----'] = withdrawLike('R')
geometries['G*T*W-----'] = withdrawLike('W')
geometries['G*T*WP----'] = withdrawLike('WP')

geometries['G*T*R-----'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const A = G.toLatLon(G.coordinates(point))
  const lineA = G.coordinates(line).map(G.toLatLon)
  const [bearing, width] = G.bearingLine([lineA[0], A])
  const lineB = [
    lineA[0].destinationPoint(width, bearing),
    lineA[1].destinationPoint(width, bearing)
  ]

  const C = lineA[1].destinationPoint(width / 2, bearing)
  const orientation = G.orientation(A, lineA)
  const arcPoints = arc(C, width / 2, bearing, -orientation * 180)
  const arrowA = simpleArrowEnd(lineA, resolution)
  const arrowB = simpleArrowEnd(lineB.reverse(), resolution)
  return lineStyle(feature, [lineA, lineB, arcPoints, arrowA, arrowB])
    .concat(lineLabel(lineA, 'RIP'))
}

geometries['G*T*P-----'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const bearing = G.finalBearing(linePoints)
  const A = linePoints[1].destinationPoint(halfWidth, bearing + 90)
  const B = linePoints[1].destinationPoint(halfWidth, bearing - 90)
  const arrowC = simpleArrowEnd(linePoints, resolution)
  return lineStyle(feature, [[A, B], linePoints, arrowC])
    .concat(lineLabel(linePoints, 'P'))
}

// 2.X.1.10: TACTICAL GRAPHICS - TASKS - DISRUPT
geometries['G*T*T-----'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const [bearing, distance] = G.bearingLine(linePoints)
  const A1 = linePoints[0].destinationPoint(halfWidth, bearing - 90)
  const A2 = A1.destinationPoint(distance * 0.5, bearing)
  const B1 = linePoints[0].destinationPoint(-distance * 0.25, bearing)
  const B2 = linePoints[0].destinationPoint(distance * 0.75, bearing)
  const C1 = linePoints[0].destinationPoint(halfWidth, bearing + 90)
  const C2 = C1.destinationPoint(distance, bearing)

  return lineStyle(feature, [
    [A1, C1],
    [A1, A2],
    [B1, B2],
    [C1, C2],
    simpleArrowEnd([A1, A2], resolution),
    simpleArrowEnd([B1, B2], resolution),
    simpleArrowEnd([C1, C2], resolution)
  ]).concat(lineLabel([linePoints[0], B2], 'D'))
}

geometries['G*T*X-----'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const bearing = G.finalBearing(linePoints)
  const A = linePoints[1].destinationPoint(halfWidth, bearing + 90)
  const B = linePoints[1].destinationPoint(halfWidth, bearing - 90)
  const [A1, A2] = G.translateLine(halfWidth * 0.75, 90)(linePoints)
  const [B1, B2] = G.translateLine(halfWidth * 0.75, -90)(linePoints)
  const arrowA = simpleArrowEnd([A1, A2], resolution)
  const arrowB = simpleArrowEnd([B1, B2], resolution)
  const arrowC = simpleArrowEnd(linePoints, resolution)

  return lineStyle(feature, [
    [A, B],
    linePoints,
    [A1, A2],
    [B1, B2],
    arrowA,
    arrowB,
    arrowC
  ]).concat(lineLabel(linePoints, 'C'))
}

geometries['G*T*Y-----'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const [A1, A2] = G.translateLine(halfWidth, 90)(linePoints)
  const [B1, B2] = G.translateLine(halfWidth, -90)(linePoints)
  const arrowA = simpleArrowEnd([A1, A2], resolution)
  const arrowB = simpleArrowEnd([B1, B2], resolution)
  return lineStyle(feature, [[A1, B1], [A1, A2], [B1, B2], arrowA, arrowB])
    .concat(lineLabel(linePoints, 'B', 0))
}

export const collectionStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const geometryFns = geometries[sidc] || defaultStyle
  return [geometryFns].flatMap(fn => fn(feature, resolution))
}

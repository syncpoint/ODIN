import * as R from 'ramda'
import { defaultStyle, lineStyle, arc, arcLabel, lineLabel } from './default-style'
import { parameterized } from '../../components/SIDC'
import * as G from './geodesy'
import { closedArrowEnd, simpleArrowEnd, simpleCrossEnd } from './arrows'

const lastSegment = arc => [arc[arc.length - 2], arc[arc.length - 1]]

const styles = {}

// TACGRP.C2GM.GNL.ARS.SRHARA
styles['G*G*GAS---'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 3) return defaultStyle(feature)

  const [C, A, B] = points.map(G.toLatLon)
  const arrowA = closedArrowEnd([C, A], resolution)
  const arrowB = closedArrowEnd([C, B], resolution)
  const lines = [[C, arrowA[3]], [C, arrowB[3]], arrowA, arrowB]
  return lineStyle(feature, lines)
}

// TACGRP.TSK.ISL
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
    simpleArrowEnd(lastSegment(outerArc), resolution)
  ]).concat(arcLabel(C, radius, angle, 'I'))
}

// TACGRP.TSK.OCC
styles['G*T*O-----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)

  return lineStyle(feature, [
    outerArc,
    ...simpleCrossEnd(lastSegment(outerArc), resolution)
  ]).concat(arcLabel(C, radius, angle, 'O'))
}

// TACGRP.TSK.RTN
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
    simpleArrowEnd(lastSegment(innerArc), resolution)
  ]).concat(arcLabel(C, radius * 0.8, angle, 'R'))
}

// TACGRP.TSK.SCE
styles['G*T*S-----'] = (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)

  return lineStyle(feature, [
    outerArc,
    simpleArrowEnd(lastSegment(outerArc), resolution)
  ]).concat(arcLabel(C, radius, angle, 'S'))
}

const fanLike = text => (feature, resolution) => {
  const points = G.coordinates(feature)
  if (points.length !== 3) return defaultStyle(feature)

  const [C, A, B] = points.map(G.toLatLon)
  const [bearingA, distanceA] = G.bearingLine([C, A])
  const [bearingB, distanceB] = G.bearingLine([C, B])
  const arrowA = simpleArrowEnd([C, A], resolution)
  const arrowB = simpleArrowEnd([C, B], resolution)
  const A1 = C.destinationPoint(distanceA / 1.95, bearingA - 4)
  const A2 = A.destinationPoint(-distanceA / 1.95, bearingA - 4)
  const B1 = C.destinationPoint(distanceB / 1.95, bearingB + 4)
  const B2 = B.destinationPoint(-distanceB / 1.95, bearingB + 4)

  return lineStyle(feature, [
    [C, A1, A2, A],
    [C, B1, B2, B],
    arrowA,
    arrowB
  ]).concat([
    lineLabel([C, A1], text, 0.4),
    lineLabel([C, B1], text, 0.4)
  ])
}

styles['G*T*US----'] = fanLike('S') // TACGRP.TSK.SEC.SCN
styles['G*T*UG----'] = fanLike('G') // TACGRP.TSK.SEC.GUD
styles['G*T*UC----'] = fanLike('C') // TACGRP.TSK.SEC.COV

export const multipointStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const geometryFns = styles[sidc] || defaultStyle
  return [geometryFns].flatMap(fn => fn(feature, resolution))
}

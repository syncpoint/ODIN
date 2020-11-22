import * as R from 'ramda'
import { defaultStyle, lineStyle, arc, lineLabel, arcLabel } from './default-style'
import { parameterized } from '../../components/SIDC'
import * as G from './geodesy'
import { simpleArrowEnd, slashEnd, closedArrowEnd } from './arrows'
import { K } from '../../../shared/combinators'
import corridors from './corridors'
import styles from './default-style-2'

const fns = {}

/**
 * TACGRP.C2GM.OFF.ARS.AFP
 * ATTACK BY FIRE POSITION
 */
fns['G*G*OAF---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const bearing = G.initialBearing(linePoints)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const A1 = linePoints[0].destinationPoint(halfWidth, bearing + 90)
  const A2 = A1.destinationPoint(resolution * 20, bearing + 135)
  const B1 = linePoints[0].destinationPoint(halfWidth, bearing - 90)
  const B2 = B1.destinationPoint(resolution * 20, bearing - 135)
  return lineStyle(feature, [
    linePoints,
    [A2, A1, B1, B2],
    simpleArrowEnd(linePoints, resolution)
  ])
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.FRDDFT
 * FORD DIFFICULT
 */
fns['G*M*BCD---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const [bearing, distance] = G.bearingLine(linePoints)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const A = linePoints[0].destinationPoint(distance / 2, bearing)
  const B = A.destinationPoint(halfWidth + resolution * 10, bearing + 90)
  const C = A.destinationPoint(halfWidth + resolution * 10, bearing - 90)
  const X = G.translateLine(resolution * 4, 90)([B, C])
  const Y = G.translateLine(resolution * 4, -90)([B, C])
  const SX = G.segmentizeLine(X, resolution).filter((_, i) => i % 2 === 0)
  const SY = G.segmentizeLine(Y, resolution).filter((_, i) => (i + 1) % 2 === 0)

  return lineStyle(feature, [
    G.translateLine(halfWidth, 90)(linePoints),
    G.translateLine(halfWidth, -90)(linePoints)
  ])
    .map(s => K(s)(s => s.getStroke().setLineDash([20, 10])))
    .concat(lineStyle(feature, [R.flatten(R.zip(SX, SY))]))
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.FRDESY
 * FORD EASY
 */
fns['G*M*BCE---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  return lineStyle(feature, [
    G.translateLine(halfWidth, 90)(linePoints),
    G.translateLine(halfWidth, -90)(linePoints)
  ]).map(s => K(s)(s => s.getStroke().setLineDash([20, 10])))
}

/**
 * TACGRP.MOBSU.OBSTBP.DFTY.DFT
 * BYPASS DIFFICULT
 */
fns['G*M*BDD---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const [A1, A2] = G.translateLine(halfWidth, 90)(linePoints)
  const [B1, B2] = G.translateLine(halfWidth, -90)(linePoints)
  const [C1, C2] = G.translateLine(resolution * 4, 90)([A1, B1])
  const [D1, D2] = G.translateLine(resolution * 4, -90)([A1, B1])
  const arrowA = closedArrowEnd([A1, A2], resolution)
  const arrowB = closedArrowEnd([B1, B2], resolution)

  const SC = G.segmentizeLine([C1, C2], resolution).filter((_, i) => i % 2 === 0)
  const SD = G.segmentizeLine([D1, D2], resolution).filter((_, i) => (i + 1) % 2 === 0)

  return lineStyle(feature, [
    [arrowA[3], A1, ...R.flatten(R.zip(SC, SD)), B1, arrowB[3]],
    arrowA,
    arrowB
  ])
}

/**
 * TACGRP.MOBSU.OBSTBP.DFTY.ESY
 * BYPASS EASY
 */
fns['G*M*BDE---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const [A1, A2] = G.translateLine(halfWidth, 90)(linePoints)
  const [B1, B2] = G.translateLine(halfWidth, -90)(linePoints)
  const arrowA = closedArrowEnd([A1, A2], resolution)
  const arrowB = closedArrowEnd([B1, B2], resolution)
  return lineStyle(feature, [
    [arrowA[3], A1, B1, arrowB[3]],
    arrowA,
    arrowB
  ])
}

/**
 * TACGRP.MOBSU.OBSTBP.DFTY.IMP
 * BYPASS IMPOSSIBLE
 */
fns['G*M*BDI---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const bearing = G.initialBearing(linePoints)
  const [A1, A2] = G.translateLine(halfWidth, 90)(linePoints)
  const [B1, B2] = G.translateLine(halfWidth, -90)(linePoints)
  const A3 = linePoints[0].destinationPoint(resolution * 5, bearing + 90)
  const B3 = linePoints[0].destinationPoint(resolution * 5, bearing - 90)
  const A4 = A3.destinationPoint(-resolution * 5, bearing)
  const A5 = A3.destinationPoint(resolution * 5, bearing)
  const B4 = B3.destinationPoint(-resolution * 5, bearing)
  const B5 = B3.destinationPoint(resolution * 5, bearing)
  const arrowA = closedArrowEnd([A1, A2], resolution)
  const arrowB = closedArrowEnd([B1, B2], resolution)
  return lineStyle(feature, [
    [arrowA[3], A1, A3],
    [arrowB[3], B1, B3],
    [A4, A5],
    [B4, B5],
    arrowA,
    arrowB
  ])
}

/**
 * TACGRP.MOBSU.OBST.OBSEFT.BLK
 * OBSTACLE EFFECT / BLOCK
 */
fns['G*M*OEB---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const bearing = G.initialBearing(linePoints)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const A = linePoints[0].destinationPoint(halfWidth, bearing + 90)
  const B = linePoints[0].destinationPoint(halfWidth, bearing - 90)
  return lineStyle(feature, [linePoints, [A, B]])
}

/**
 * TACGRP.MOBSU.OBST.RCBB.ABP
 * BLOWN BRIDGES / ARMED-BUT PASSABLE
 */
fns['G*M*ORA---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  return lineStyle(feature, [
    G.translateLine(halfWidth, 90)(linePoints),
    G.translateLine(halfWidth, -90)(linePoints)
  ])
}

/**
 * TACGRP.MOBSU.OBST.RCBB.EXCD
 * BLOWN BRIDGES / EXECUTED
 */
fns['G*M*ORC---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const C = G.mirrorPoints(linePoints)

  return lineStyle(feature, [
    G.translateLine(halfWidth, 90)(linePoints),
    G.translateLine(halfWidth, -90)(linePoints),
    G.translateLine(halfWidth, 90)(C),
    G.translateLine(halfWidth, -90)(C)
  ])
}

/**
 * TACGRP.MOBSU.OBST.RCBB.SAFE
 * BLOWN BRIDGES / SAFE
 */
fns['G*M*ORS---'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const styleA = lineStyle(feature, [G.translateLine(halfWidth, 90)(linePoints)])
    .map(s => K(s)(s => s.getStroke().setLineDash([15, 15])))
  const styleB = lineStyle(feature, [G.translateLine(halfWidth, -90)(linePoints)])
  return styleA.concat(styleB)
}

/**
 * TACGRP.TSK.BLK
 * TASKS / BLOCK
 */
fns['G*T*B-----'] = (feature, resolution) => {
  const [line, point] = feature.getGeometry().getGeometries()
  const linePoints = G.coordinates(line).map(G.toLatLon)
  const bearing = G.finalBearing(linePoints)
  const halfWidth = G.distance([linePoints[0], G.toLatLon(G.coordinates(point))])
  const A = linePoints[1].destinationPoint(halfWidth, bearing + 90)
  const B = linePoints[1].destinationPoint(halfWidth, bearing - 90)
  return lineStyle(feature, [linePoints, [A, B]]).concat(lineLabel(linePoints, 'B'))
}

/**
 * TACGRP.TSK.CNZ
 * TASKS / CANALIZE
 */
fns['G*T*C-----'] = (feature, resolution) => {
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

/**
 * TACGRP.TSK.BRH
 * TASKS / BREACH
 */
fns['G*T*H-----'] = (feature, resolution) => {
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

/**
 * TACGRP.TSK.CNT
 * TASKS / CONTAIN
 */
fns['G*T*J-----'] = (feature, resolution) => {
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

/**
 * TACGRP.TSK.DLY
 * TASKS / DELAY
 */
fns['G*T*L-----'] = withdrawLike('D') // TACGRP.TSK.DLY

/**
 * TACGRP.TSK.RTM
 * TASKS / RETIREMENT
 */
fns['G*T*M-----'] = withdrawLike('R') // TACGRP.TSK.RTM

/**
 * TACGRP.TSK.WDR
 * TASKS / WITHDRAW
 */
fns['G*T*W-----'] = withdrawLike('W') // TACGRP.TSK.WDR

/**
 * TACGRP.TSK.WDR.WDRUP
 * TASKS / WITHDRAW UNDER PRESSURE
 */
fns['G*T*WP----'] = withdrawLike('WP') // TACGRP.TSK.WDR.WDRUP

/**
 * TACGRP.TSK.RIP
 * TASKS / RELIEF IN PLACE (RIP)
 */
fns['G*T*R-----'] = (feature, resolution) => {
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

/**
 * TACGRP.TSK.PNE
 * TASKS / PENETRATE
 */
fns['G*T*P-----'] = (feature, resolution) => {
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

/**
 * TACGRP.TSK.DRT
 * TASKS / DISRUPT
 **/
fns['G*T*T-----'] = (feature, resolution) => {
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

/**
 * TACGRP.TSK.CLR
 * TASKS / CLEAR
 */
fns['G*T*X-----'] = (feature, resolution) => {
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

/**
 * TACGRP.TSK.BYS
 * TASKS / BYPASS
 */
fns['G*T*Y-----'] = (feature, resolution) => {
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

export const collectionStyle = mode => (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)

  // TODO: clean up this mess

  if (fns[sidc]) return fns[sidc](feature, resolution).flat()
  else if (corridors[sidc]) {
    const options = { mode, feature, resolution, styles: styles(mode, feature) }
    return corridors[sidc](options).flat()
  } else return defaultStyle(feature, resolution).flat()
}

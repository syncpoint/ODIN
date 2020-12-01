import * as R from 'ramda'
import { defaultStyle, arc, arcLabel, lineLabel } from './default-style'
import { parameterized } from '../../components/SIDC'
import * as G from './geodesy'
import { closedArrowEnd, simpleArrowEnd, simpleCrossEnd } from './arrows'
import { format } from '../format'
import styles from './default-style-2'

const lastSegment = arc => [arc[arc.length - 2], arc[arc.length - 1]]

const geometries = {}

/**
 * TACGRP.C2GM.GNL.ARS.SRHARA
 * SEARCH AREA/RECONNAISSANCE AREA
 */
geometries['G*G*GAS---'] = ({ feature, resolution, styles }) => {
  const points = G.coordinates(feature)
  if (points.length !== 3) return defaultStyle(feature)

  const [C, A, B] = points.map(G.toLatLon)
  const arrowA = closedArrowEnd([C, A], resolution)
  const arrowB = closedArrowEnd([C, B], resolution)
  const lines = [[C, arrowA[3]], [C, arrowB[3]], arrowA, arrowB]
  return styles.multiLineString(lines)
}

/**
 * TACGRP.TSK.ISL
 * TASKS / ISOLATE
 */
geometries['G*T*E-----'] = ({ feature, resolution, styles }) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)
  const innerArc = arc(C, radius * 0.8, angle, 330)
  const teeth = R.range(1, outerArc.length)
    .filter(i => i % 5 === 0)
    .map(i => [outerArc[i - 1], innerArc[i], outerArc[i + 1]])

  return [
    styles.multiLineString([
      outerArc,
      ...teeth,
      simpleArrowEnd(lastSegment(outerArc), resolution)
    ]),
    arcLabel(C, radius, angle, 'I')
  ]
}

/**
 * TACGRP.TSK.OCC
 * TASKS / OCCUPY
 */
geometries['G*T*O-----'] = ({ feature, resolution, styles }) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)

  return [
    styles.multiLineString([
      outerArc,
      ...simpleCrossEnd(lastSegment(outerArc), resolution)
    ]),
    arcLabel(C, radius, angle, 'O')
  ]
}

/**
 * TACGRP.TSK.RTN
 * TASKS / RETAIN
 */
geometries['G*T*Q-----'] = ({ feature, resolution, styles }) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)
  const innerArc = arc(C, radius * 0.8, angle, 330)
  const spikes = R.range(1, outerArc.length - 2)
    .filter(i => i % 2 === 0)
    .map(i => [outerArc[i], innerArc[i]])

  return [
    styles.multiLineString([
      innerArc,
      ...spikes,
      simpleArrowEnd(lastSegment(innerArc), resolution)
    ]),
    arcLabel(C, radius * 0.8, angle, 'R')
  ]
}

/**
 * TACGRP.TSK.SCE
 * TASKS / SECURE
 */
geometries['G*T*S-----'] = ({ feature, resolution, styles }) => {
  const points = G.coordinates(feature)
  if (points.length !== 2) return defaultStyle(feature)

  const [C, A] = points.map(G.toLatLon)
  const [angle, radius] = G.bearingLine([C, A])
  const outerArc = arc(C, radius, angle, 330)

  return [
    styles.multiLineString([
      outerArc,
      simpleArrowEnd(lastSegment(outerArc), resolution)
    ]),
    arcLabel(C, radius, angle, 'S')
  ]
}

const fanLike = text => ({ feature, resolution, styles }) => {
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

  return [
    styles.multiLineString([
      [C, A1, A2, A],
      [C, B1, B2, B],
      arrowA,
      arrowB
    ]),
    lineLabel([C, A1], text, 0.4),
    lineLabel([C, B1], text, 0.4)
  ]
}

/**
 * TACGRP.TSK.SEC.SCN
 * TASKS / SCREEN
 */
geometries['G*T*US----'] = fanLike('S')

/**
 * TACGRP.TSK.SEC.GUD
 * TASKS / GUARD
 */
geometries['G*T*UG----'] = fanLike('G')

/**
 * TACGRP.TSK.SEC.COV
 * TASKS / COVER
 */
geometries['G*T*UC----'] = fanLike('C')

export const multipointStyle = mode => (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const geometry = feature.getGeometry()
  const reference = geometry.getFirstCoordinate()
  const { read, write } = format(reference)
  const points = read(geometry)
  const styleFactory = styles(mode, feature)(write)
  const options = { feature, resolution, styles: styleFactory }

  return [
    geometries[sidc] ? geometries[sidc](options).flat() : defaultStyle(feature),
    styleFactory.handles(points)
  ].flat()
}

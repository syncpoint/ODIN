import * as R from 'ramda'
import { arc, arcLabel } from './default-style'
import { parameterized } from '../../components/SIDC'
import * as G from './geodesy'
import { simpleArrowEnd, simpleCrossEnd } from './arrows'
import { format } from '../format'
import { styleFactory, defaultStyle } from './default-style-2'
import * as TS from '../ts'

const lastSegment = arc => [arc[arc.length - 2], arc[arc.length - 1]]

const geometries = {}

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

const fanLike = (arrowFn, label) => options => {
  const { resolution, styles, points } = options
  const [C, A, B] = TS.coordinates(points)
  const segmentA = TS.segment([C, A])
  const segmentB = TS.segment([C, B])

  const distance = resolution * 4
  const [A1, A2, B1, B2] = [
    TS.projectCoordinates(distance, segmentA.angle(), segmentA.pointAlong(0.55))([[0, -1]]),
    TS.projectCoordinates(distance, segmentA.angle(), segmentA.pointAlong(0.45))([[0, +1]]),
    TS.projectCoordinates(distance, segmentB.angle(), segmentB.pointAlong(0.55))([[0, +1]]),
    TS.projectCoordinates(distance, segmentB.angle(), segmentB.pointAlong(0.45))([[0, -1]])
  ].flat()

  const text = segment => styles.text(TS.point(segment.pointAlong(0.3)), {
    rotation: Math.PI - segment.angle(),
    text: label,
    flip: true
  })

  const arrow = segment => arrowFn(TS.point(segment.p1), {
    radius: 8,
    rotation: 2.5 * Math.PI - segment.angle()
  })

  return [
    styles.solidLine(TS.collect([
      TS.lineString([C, A1, A2, A]),
      TS.lineString([C, B1, B2, B])
    ])),
    ...(label ? [TS.segment([C, A1]), TS.segment([C, B1])].map(text) : []),
    ...[TS.segment([A2, A]), TS.segment([B2, B])].map(arrow)
  ]
}

/**
 * TACGRP.TSK.SEC.SCN
 * TASKS / SCREEN
 */
geometries['G*T*US----'] = options => fanLike(options.styles.openArrow, 'S')(options)

/**
 * TACGRP.TSK.SEC.GUD
 * TASKS / GUARD
 */
geometries['G*T*UG----'] = options => fanLike(options.styles.openArrow, 'G')(options)

/**
 * TACGRP.TSK.SEC.COV
 * TASKS / COVER
 */
geometries['G*T*UC----'] = options => fanLike(options.styles.openArrow, 'C')(options)

/**
 * TACGRP.C2GM.GNL.ARS.SRHARA
 * SEARCH AREA/RECONNAISSANCE AREA
 */
geometries['G*G*GAS---'] = options => fanLike(options.styles.closedArrow)(options)

export const multipointStyle = mode => (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const geometry = feature.getGeometry()
  const reference = geometry.getFirstCoordinate()
  const { read, write } = format(reference)
  const points = read(geometry)
  const factory = styleFactory(mode, feature)(write)
  const options = { feature, resolution, points, styles: factory }

  return [
    geometries[sidc] ? geometries[sidc](options).flat() : defaultStyle(feature),
    factory.handles(points)
  ].flat()
}

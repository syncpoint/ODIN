import * as R from 'ramda'
import { parameterized } from '../../components/SIDC'
import { format } from '../format'
import { styleFactory, defaultStyle, biggerFont } from './default-style'
import * as TS from '../ts'

const quads = 64
const deg2rad = Math.PI / 180
const geometries = {}

const arcText = styles => (anchor, angle, text) => styles.text(anchor, {
  text,
  font: biggerFont,
  flip: true,
  textAlign: () => 'center',
  rotation: 2 * Math.PI - angle + 330 / 2 * deg2rad
})

const arcArrow = (arc, angle, arrowFn) => arrowFn(
  TS.point(arc[arc.length - 1]),
  {
    rotation: 330 * deg2rad - angle + Math.PI,
    radius: 15
  }
)

/**
 * TACGRP.TSK.ISL
 * TASKS / ISOLATE
 */
geometries['G*T*E-----'] = ({ styles, points, resolution }) => {
  const [C, A] = TS.coordinates(points)
  const [angle, radius] = TS.bearingDistance(C, A)
  const arcs = [
    TS.arc(C, radius, angle, 330 * deg2rad, quads),
    TS.arc(C, 0.8 * radius, angle, 330 * deg2rad, quads)
  ]

  const teeth = R.range(1, arcs[0].length)
    .filter(i => i % 5 === 0)
    .map(i => [arcs[0][i - 1], arcs[1][i], arcs[0][i + 1]])
    .map(coords => TS.lineString(coords))

  const textAnchor = TS.point(arcs[0][Math.floor(arcs[0].length / 2)])
  const geometry = TS.difference([
    TS.union([...teeth, TS.lineString(arcs[0])]),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(geometry),
    arcArrow(arcs[0], angle, styles.openArrow),
    arcText(styles)(textAnchor, angle, 'I')
  ]
}

/**
 * TACGRP.TSK.OCC
 * TASKS / OCCUPY
 */
geometries['G*T*O-----'] = ({ points, resolution, styles }) => {
  const [C, A] = TS.coordinates(points)
  const [angle, radius] = TS.bearingDistance(C, A)
  const arc = TS.arc(C, radius, angle, 330 * deg2rad, quads)
  const textAnchor = TS.point(arc[Math.floor(arc.length / 2)])
  const geometry = TS.difference([
    TS.lineString(arc),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(geometry),
    arcArrow(arc, angle, styles.crossArrow),
    arcText(styles)(textAnchor, angle, 'O')
  ]
}

/**
 * TACGRP.TSK.RTN
 * TASKS / RETAIN
 */
geometries['G*T*Q-----'] = ({ points, resolution, styles }) => {
  const [C, A] = TS.coordinates(points)
  const [angle, radius] = TS.bearingDistance(C, A)
  const arcs = [
    TS.arc(C, radius, angle, 330 * deg2rad, quads),
    TS.arc(C, 0.8 * radius, angle, 330 * deg2rad, quads)
  ]

  const spikes = R.range(1, arcs[0].length - 2)
    .filter(i => i % 2 === 0)
    .map(i => [arcs[0][i], arcs[1][i]])
    .map(coords => TS.lineString(coords))

  const textAnchor = TS.point(arcs[1][Math.floor(arcs[0].length / 2)])
  const geometry = TS.difference([
    TS.union([...spikes, TS.lineString(arcs[1])]),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(geometry),
    arcArrow(arcs[1], angle, styles.openArrow),
    arcText(styles)(textAnchor, angle, 'R')
  ]
}

/**
 * TACGRP.TSK.SCE
 * TASKS / SECURE
 */
geometries['G*T*S-----'] = ({ points, resolution, styles }) => {
  const [C, A] = TS.coordinates(points)
  const [angle, radius] = TS.bearingDistance(C, A)
  const arc = TS.arc(C, radius, angle, 330 * deg2rad, quads)
  const textAnchor = TS.point(arc[Math.floor(arc.length / 2)])
  const geometry = TS.difference([
    TS.lineString(arc),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(geometry),
    arcArrow(arc, angle, styles.openArrow),
    arcText(styles)(textAnchor, angle, 'S')
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

import * as R from 'ramda'
import * as TS from '../../ts'
import { arrowCoordinates } from './arrow'

/**
 * TACGRP.C2GM.OFF.LNE.AXSADV.ABN
 * AXIS OF ADVANCE / AIRBORNE
 */
export default options => {
  const { width, line, styles } = options
  const aps = arrowCoordinates(width, line)([
    [0, 0], [3 / 4, 1], [3 / 4, 1 / 2], [3 / 4, 0], [3 / 4, -1 / 2], [3 / 4, -1]
  ])

  const arrow = TS.polygon(R.props([0, 1, 5, 0], aps))
  const centerline = TS.lineString([...R.init(line.getCoordinates()), aps[3]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const linePoints = TS.coordinates([line])

  const cutpoint = linePoints.length === 2
    ? TS.point(linePoints[0])
    : TS.point(linePoints[linePoints.length - 2])

  const segments = R.aperture(2, linePoints).map(TS.segment)
  const cutline = (() => {
    const bisector = (a, b) => (a.angle() + b.angle()) / 2
    const angle = segments.length === 1
      ? segments[0].angle()
      : bisector(segments[segments.length - 1], segments[segments.length - 2])

    return TS.lineString(TS.coordinates([
      TS.translate(angle + Math.PI / 2, cutpoint)(width),
      TS.translate(angle - Math.PI / 2, cutpoint)(width)
    ]))
  })()

  const crossing = (() => {
    const [p1, p2] = TS.coordinates([TS.intersection([buffer.getBoundary(), cutline])])
    const a = TS.lineString([p1, aps[2]])
    const b = TS.lineString([p2, aps[4]])
    if (a.intersects(b)) return TS.union([a, b])
    else {
      return TS.union([
        TS.lineString([p1, aps[4]]),
        TS.lineString([p2, aps[2]])
      ])
    }
  })()

  const cutout = TS
    .geometryCollection([cutline, TS.point(aps[2]), TS.point(aps[4])])
    .convexHull()

  const body = TS.union([buffer, arrow]).getBoundary()
  const opening = TS.pointBuffer(TS.startPoint(line))(width / 2)
  const corridor = TS.union([
    TS.difference([body, cutout, opening]),
    crossing
  ])

  return styles.solidLine(corridor)
}

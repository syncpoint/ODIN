import * as R from 'ramda'
import * as TS from '../ts'
import { arrowCoordinates } from './arrow'

/**
 * TACGRP.C2GM.OFF.LNE.AXSADV.ATK
 * AXIS OF ADVANCE ATTACK, ROTARY WING
 */
export default options => {
  const { width, line, point, styles } = options
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

  const segments = R.aperture(2, linePoints).map(TS.lineSegment)
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

  const [p1, p2] = TS.coordinates([TS.intersection([buffer.getBoundary(), cutline])])
  var a = TS.lineString([p1, aps[2]])
  var b = TS.lineString([p2, aps[4]])
  if (!a.intersects(b)) {
    a = TS.lineString([p1, aps[4]])
    b = TS.lineString([p2, aps[2]])
  }

  const crossing = TS.union([a, b])
  const intersection = a.intersection(b)

  const xyz = TS.lineSegment([aps[2], aps[4]])
  const mp = xyz.midPoint()
  const [tx, ty] = [
    mp.x - intersection.getCoordinate().x,
    mp.y - intersection.getCoordinate().y
  ]

  xyz.p0 = new TS.Coordinate(xyz.p0.x - tx, xyz.p0.y - ty)
  xyz.p1 = new TS.Coordinate(xyz.p1.x - tx, xyz.p1.y - ty)

  if (xyz.angle() < 0) xyz.reverse()
  const lineClone = line.copy()
  /* eslint-disable camelcase */
  const abc_1 = xyz.toGeometry(TS.geometryFactory)
  const abc_x = TS.lineSegment([R.head(R.drop(1, lineClone.getCoordinates().reverse())), aps[3]]).toGeometry(TS.geometryFactory)
  const abc_2 = TS.translate(xyz.angle() + Math.PI / 2, abc_1)(abc_x.getLength() * 0.2)
  const abc_3 = TS.translate(xyz.angle() + Math.PI / 2, abc_1)(-abc_x.getLength() * 0.2)

  const acs = arrowCoordinates(width, xyz.toGeometry(TS.geometryFactory))([
    [5 / 26, 5 / 26], [0, 0], [5 / 26, -5 / 26],
    [1, 5 / 26], [1, -5 / 26]
  ])

  const cutout = TS
    .geometryCollection([cutline, TS.point(aps[2]), TS.point(aps[4])])
    .convexHull()

  const body = TS.union([buffer, arrow]).getBoundary()
  const opening = TS.pointBuffer(TS.startPoint(line))(width / 2)
  const corridor = TS.union([
    TS.difference([body, cutout, opening]),
    crossing,
    TS.union([
      abc_1,
      TS.lineString(R.props([0, 1, 2], acs)),
      TS.lineString(R.props([3, 4], acs)),
      TS.lineString((abc_2.intersection(crossing)).getCoordinates()),
      TS.lineString((abc_3.intersection(crossing)).getCoordinates())
    ])
  ])

  return [
    styles.solidLine(corridor),
    styles.wireFrame(line),
    styles.handles(TS.multiPoint([point, ...TS.linePoints(line)]))
  ]
}

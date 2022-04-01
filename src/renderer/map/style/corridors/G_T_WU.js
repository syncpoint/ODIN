import * as TS from '../../ts'
import { openArrow } from './arrow'

/**
 * TACGRP.TSK.PUR
 * TASKS / PURSUE
 */

export default options => {
  const { styles, width, line, point, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const orientation = segment.orientationIndex(TS.coordinate(point))
  const angle = segment.angle()

  const [px] = TS.projectCoordinates(width / 4, angle, coords[0])([[0, -orientation]])
  const [p0] = TS.projectCoordinates(width / 2, angle, coords[0])([[0, -orientation]])
  const [p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, -orientation]])

  const arc = TS.difference([
    TS.boundary(TS.pointBuffer(TS.point(px))(width / 4)),
    TS.polygon([coords[0], p0, p1, coords[1], coords[0]])
  ])

  return [
    styles.solidLine(TS.collect([
      line,
      TS.lineString(TS.projectCoordinates(width / 2, angle, p0)([[0, 0.5], [0, -0.5]])),
      openArrow(resolution, angle, p0),
      arc
    ])),
    styles.text(TS.point(segment.midPoint()), {
      text: 'P',
      flip: true,
      rotation: Math.PI - angle
    }),
    styles.wireFrame(line),
    ...styles.handles(TS.multiPoint([point, ...TS.linePoints(line)]))
  ]
}

import * as TS from '../../ts'
import { openArrow } from './arrow'

/**
 * TACGRP.TSK.DEM
 * TASKS / DEMONSTRATE
 */
export default options => {
  const { styles, width, line, point, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const orientation = segment.orientationIndex(TS.coordinate(point))
  const angle = segment.angle()

  const [px] = TS.projectCoordinates(width / 4, angle, coords[1])([[0, -orientation]])
  const [p0] = TS.projectCoordinates(width / 2, angle, coords[0])([[0, -orientation]])
  const [p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, -orientation]])
  const [p2] = TS.projectCoordinates(width / 2, angle, coords[1])([[-0.5, -orientation]])

  const arc = TS.difference([
    TS.boundary(TS.pointBuffer(TS.point(px))(width / 4)),
    TS.polygon([coords[0], p0, p1, coords[1], coords[0]])
  ])

  return [
    styles.solidLine(TS.collect([
      line,
      TS.lineString([p1, p0]),
      openArrow(resolution, angle + Math.PI, p0),
      arc
    ])),
    styles.text(TS.point(p2), {
      text: 'DEM',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}

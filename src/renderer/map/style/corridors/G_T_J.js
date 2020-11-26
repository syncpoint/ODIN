import * as R from 'ramda'
import * as TS from '../../ts'
import { openArrow } from './arrow'

/**
 * TACGRP.TSK.CNT
 * TASKS / CONTAIN
 */
export default options => {
  const { styles, width, line, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const cutout = TS.polygon(R.props([0, 1, 3, 2, 0], [
    ...TS.projectCoordinates(width, angle, coords[0])([[0, 1], [0, -1]]),
    ...TS.projectCoordinates(width, angle, coords[1])([[0, 1], [0, -1]])
  ]))

  const arcs = [width / 2, width / 2.5].map(radius => TS.difference([
    TS.boundary(TS.pointBuffer(TS.endPoint(line))(radius)),
    cutout
  ]))

  const spikes = R
    .zip(TS.coordinates(arcs[0]), TS.coordinates(arcs[1]))
    .map(coords => TS.lineString(coords))

  const [p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[1, 0]])

  return [
    styles.solidLine(TS.collect([
      line,
      arcs[0],
      ...spikes,
      openArrow(resolution, angle, coords[1])
    ])),
    styles.text(TS.point(p1), {
      text: 'C',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}

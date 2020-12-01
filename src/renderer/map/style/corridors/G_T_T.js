import * as R from 'ramda'
import * as TS from '../../ts'
import { openArrow } from './arrow'

const K = v => fn => { fn(v); return v }

/**
 * TACGRP.TSK.DRT
 * TASKS / DISRUPT
 */
export default options => {
  const { styles, width, line, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const interpolate = ([fraction, segment]) =>
    K(segment)(segment => (segment.p1 = segment.pointAlong(fraction)))

  const segments = R.zip([0.5, 0.75, 1], R.splitEvery(2, R.props([2, 5, 0, 3, 1, 4], [
    coords[0], ...TS.projectCoordinates(width / 2, angle, coords[0])([[0, 1], [0, -1]]),
    coords[1], ...TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
  ])))
    .map(([fraction, coords]) => [fraction, TS.segment(coords)])
    .map(interpolate)

  const arrows = segments.map(segment => openArrow(resolution, angle, segment.p1))

  return [
    styles.solidLine(TS.collect([
      TS.lineString(segments[0]),
      TS.lineString(segments[1]),
      TS.lineString(segments[2]),
      TS.lineString([segments[0].p0, segments[2].p0]),
      TS.lineString([segments[1].pointAlong(-0.25), segments[1].p0]),
      ...arrows
    ])),
    styles.text(TS.point(segments[1].midPoint()), {
      text: 'D',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}

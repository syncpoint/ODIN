import * as R from 'ramda'
import * as TS from '../../ts'
import { openArrow } from './arrow'

const K = v => fn => { fn(v); return v }

/**
 * TACGRP.TSK.SEP
 * TASKS / SEPARATE
 */
export default options => {
  const { styles, width, line, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const interpolate = ([fraction, segment]) =>
    K(segment)(segment => (segment.p1 = segment.pointAlong(fraction)))

  const segments = R.zip([0, 1, 0], R.splitEvery(2, R.props([2, 5, 0, 3, 1, 4], [
    coords[0], ...TS.projectCoordinates(width / 2, angle, coords[0])([[0, 1], [0, -1]]),
    coords[1], ...TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
  ])))
    .map(([fraction, coords]) => [fraction, TS.segment(coords)])
    .map(interpolate)

  return [
    styles.solidLine(TS.collect([
      TS.lineString(segments[1]),
      TS.lineString([segments[0].p0, segments[2].p0]),
      TS.lineString([segments[1].pointAlong(-1), segments[1].p0]),
      openArrow(resolution, angle, coords[1]),
      openArrow(resolution, angle, segments[0].p0),
      openArrow(resolution, angle, segments[2].p0),
      openArrow(resolution, angle, segments[1].pointAlong(-1))
    ]))
  ]
}

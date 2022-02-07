import * as R from 'ramda'
import * as TS from '../../ts'
import { arrowCoordinates } from './arrow'

/**
 * TACGRP.TSK.AOC
 * TASKS / ADVANCE TO CONTACT
 */
export default options => {
  const { width, line, styles } = options

  const segments = TS.segments(line)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (48 / 26))
  if (arrowRatio < 1) throw new Error('segment too short')

  const aps = arrowCoordinates(width, line)([
    [28 / 26, 0], [48 / 26, 1], [48 / 26, -1], [48 / 26, 0],
    [33 / 26, 13 / 26], [15 / 26, 30 / 26], [25 / 26, 30 / 26], [5 / 26, 50 / 26],
    [5 / 26, 50 / 26], [7 / 26, 52 / 26], [0 / 26, 55 / 26], [3 / 26, 48 / 26],
    [33 / 26, -13 / 26], [15 / 26, -30 / 26], [25 / 26, -30 / 26], [5 / 26, -50 / 26],
    [5 / 26, -50 / 26], [7 / 26, -52 / 26], [0 / 26, -55 / 26], [3 / 26, -48 / 26]
  ])

  const arrow = TS.polygon(R.props([0, 2, 1, 0], aps))
  const centerline = TS.lineString([...R.init(line.getCoordinates()), aps[3]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const corridor = TS.difference([
    TS.union([buffer, arrow]).getBoundary(),
    TS.pointBuffer(TS.startPoint(line))(width / 2)
  ])

  return [
    styles.solidLine(TS.union([
      corridor,
      TS.lineString(R.props([4, 5, 6, 7], aps)),
      TS.lineString(R.props([12, 13, 14, 15], aps))

    ])),
    styles.filledPolygon(TS.polygon(R.props([8, 9, 10, 11, 8], aps))),
    styles.filledPolygon(TS.polygon(R.props([16, 17, 18, 19, 16], aps)))
  ]
}

import * as R from 'ramda'
import * as TS from '../../ts'
import { arrowCoordinates } from './arrow'

/**
 * TACGRP.C2GM.DCPN.AAFF
 * AXIS OF ADVANCE FOR FEINT
 */
export default options => {
  const { width, line, styles } = options
  const aps = arrowCoordinates(width, line)([
    [10 / 26, 0], [30 / 26, 1], [30 / 26, -1], [30 / 26, 0],
    [23 / 26, 30 / 26], [0, 0], [23 / 26, -30 / 26]
  ])

  const arrow = TS.polygon(R.props([0, 2, 1, 0], aps))
  const centerline = TS.lineString([...R.init(line.getCoordinates()), aps[3]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const corridor = TS.difference([
    TS.union([buffer, arrow]).getBoundary(),
    TS.pointBuffer(TS.startPoint(line))(width / 2)
  ])

  return [
    styles.solidLine(corridor),
    styles.dashedLine(TS.lineString(R.props([4, 5, 6], aps)))
  ]
}

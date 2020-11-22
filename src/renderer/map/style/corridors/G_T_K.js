import * as R from 'ramda'
import * as TS from '../ts'
import { arrowCoordinates } from './arrow'

/**
 * TACGRP.TSK.CATK
 * COUNTERATTACK (CATK)
 */
export default options => {
  const { width, line, point, styles, resolution } = options
  const aps = arrowCoordinates(width, line)([
    [0, 0], [3 / 4, 1], [3 / 4, -1], [3 / 4, 0]
  ])

  const arrow = TS.polygon(R.props([0, 2, 1, 0], aps))
  const centerline = TS.lineString([...R.init(line.getCoordinates()), aps[3]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const corridor = TS.difference([
    TS.union([buffer, arrow]).getBoundary(),
    TS.pointBuffer(TS.startPoint(line))(width / 2)
  ])

  const linePoints = TS.coordinates([line])
  const lastSegment = R.last(R.aperture(2, linePoints).map(TS.lineSegment))
  const angle = Math.PI - lastSegment.angle()
  const font = `${width / resolution / 2}px sans-serif`
  const flip = α => α > Math.PI / 2 && α < 3 * Math.PI / 2

  return [
    styles.dashedLine(corridor),
    styles.wireFrame(line),
    styles.handles(TS.multiPoint([point, ...TS.linePoints(line)])),
    styles.text(TS.point(aps[3]), {
      font,
      textAlign: flip(angle) ? 'start' : 'end',
      offsetX: flip(angle) ? -10 : 10,
      rotation: flip(angle) ? angle - Math.PI : angle,
      text: 'CATK'
    })
  ]
}

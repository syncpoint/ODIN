import * as R from 'ramda'
import * as TS from '../../ts'
import { arrowCoordinates } from './arrow'

/**
 * TACGRP.TSK.CATK
 * COUNTERATTACK (CATK)
 */
export default options => {
  const { width, line, styles, resolution } = options

  const segments = TS.segments(line)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (3 / 4))
  if (arrowRatio < 1) throw new Error('segment too short')

  const [sx, sy] = [3 / 4, 1]
  const aps = arrowCoordinates(width, line)([
    [0, 0], [sx, sy], [sx, -sy], [sx, 0]
  ])

  const arrow = TS.polygon(R.props([0, 2, 1, 0], aps))
  const centerline = TS.lineString([...R.init(line.getCoordinates()), aps[3]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const corridor = TS.difference([
    TS.union([buffer, arrow]).getBoundary(),
    TS.pointBuffer(TS.startPoint(line))(width / 2)
  ])

  const linePoints = TS.coordinates([line])
  const lastSegment = R.last(R.aperture(2, linePoints).map(TS.segment))
  const font = `${width / resolution / 2}px sans-serif`

  return [
    styles.dashedLine(corridor),
    styles.text(TS.point(aps[3]), {
      font,
      textAlign: flipped => flipped ? 'start' : 'end',
      offsetX: flipped => flipped ? -10 : 10,
      rotation: Math.PI - lastSegment.angle(),
      text: 'CATK',
      flip: true
    })
  ]
}

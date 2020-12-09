import * as R from 'ramda'
import * as TS from '../../ts'
import { arrowCoordinates } from './arrow'

/**
 * TACGRP.TSK.CATK.CATKF
 * COUNTERATTACK BY FIRE
 */
export default options => {
  const { width, line, styles, resolution } = options

  const segments = TS.segments(line)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (48 / 26))
  if (arrowRatio < 1) throw new Error('segment too short')

  const aps = arrowCoordinates(width, line)([
    [28 / 26, 0], [48 / 26, 1], [48 / 26, -1], [48 / 26, 0],
    [37 / 26, 41 / 26], [15 / 26, 1], [15 / 26, -1], [37 / 26, -41 / 26],
    [15 / 26, 0], [5 / 26, 0],
    [0, 0], [5 / 26, 3 / 26], [5 / 26, -3 / 26]
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
    styles.dashedLine(TS.union([
      corridor,
      TS.lineString(R.props([4, 5, 6, 7], aps)),
      TS.lineString(R.props([8, 9], aps))
    ])),
    styles.text(TS.point(aps[3]), {
      font,
      text: 'CATK',
      flip: true,
      textAlign: flipped => flipped ? 'start' : 'end',
      rotation: Math.PI - lastSegment.angle(),
      offsetX: flipped => flipped ? -10 : 10
    }),
    styles.filledPolygon(TS.polygon(R.props([10, 11, 12, 10], aps)))
  ]
}

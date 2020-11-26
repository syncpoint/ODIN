import * as TS from '../../ts'
import { openArrow } from './arrow'

/**
 * TACGRP.TSK.PNE
 * TASKS / PENETRATE
 */
export default options => {
  const { styles, width, line, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  return [
    styles.solidLine(TS.collect([
      line,
      openArrow(resolution, angle, coords[1]),
      TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]]))
    ])),
    styles.text(TS.point(segment.midPoint()), {
      text: 'P',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}

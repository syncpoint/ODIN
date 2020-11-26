import * as TS from '../../ts'
import { openArrow } from './arrow'

/**
 * TACGRP.TSK.BYS
 * TASKS / BYPASS
 */
export default options => {
  const { styles, width, line, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const [p0, p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])

  return [
    styles.solidLine(TS.collect([
      TS.difference([
        TS.boundary(TS.lineBuffer(line)(width / 2)),
        TS.pointBuffer(TS.endPoint(line))(width / 2)
      ]),
      openArrow(resolution, angle, p0),
      openArrow(resolution, angle, p1)
    ])),
    styles.text(TS.startPoint(line), {
      text: 'B',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}

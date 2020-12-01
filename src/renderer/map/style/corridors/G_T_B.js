import * as TS from '../../ts'

/**
 * TACGRP.TSK.BLK
 * TASKS / BLOCK
 */
export default options => {
  const { styles, width, line } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  return [
    styles.solidLine(TS.collect([
      line,
      TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]]))
    ])),
    styles.text(TS.point(segment.midPoint()), {
      text: 'B',
      flip: true,
      rotation: Math.PI - segment.angle()
    })
  ]
}

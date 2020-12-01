import * as TS from '../../ts'

/**
 * TACGRP.MOBSU.OBST.OBSEFT.BLK
 * OBSTACLE EFFECT / BLOCK
 */
export default options => {
  const { styles, width, line } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  return styles.solidLine(TS.collect([
    line,
    TS.lineString(TS.projectCoordinates(width / 2, angle, coords[0])([[0, 1], [0, -1]]))
  ]))
}

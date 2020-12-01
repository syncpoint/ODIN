import * as TS from '../../ts'

/**
 * TACGRP.MOBSU.OBST.RCBB.EXCD
 * BLOWN BRIDGES / EXECUTED
 */
export default options => {
  const { styles, width, line } = options

  const partA = TS.difference([
    TS.boundary(TS.lineBuffer(line)(width / 2)),
    TS.pointBuffer(TS.startPoint(line))(width / 2),
    TS.pointBuffer(TS.endPoint(line))(width / 2)
  ])

  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const { x, y } = segment.midPoint()
  const partB = TS.reflect(0, y, x, y)(partA)

  return styles.solidLine(TS.collect([partA, partB]))
}

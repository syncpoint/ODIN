import * as TS from '../../ts'

/**
 * TACGRP.MOBSU.OBST.RCBB.ABP
 * BLOWN BRIDGES / ARMED-BUT PASSABLE
 */
export default options => {
  const { styles, width, line } = options

  return styles.solidLine(TS.difference([
    TS.boundary(TS.lineBuffer(line)(width / 2)),
    TS.pointBuffer(TS.startPoint(line))(width / 2),
    TS.pointBuffer(TS.endPoint(line))(width / 2)
  ]))
}

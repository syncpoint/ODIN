import * as TS from '../../ts'

/**
 * TACGRP.MOBSU.OBST.RCBB.SAFE
 * BLOWN BRIDGES / SAFE
 */
export default options => {
  const { styles, width, line } = options

  // NOTE: Picking 2 out of 3 geometries might not be an exact science:
  const [...geometries] = TS.geometries(TS.difference([
    TS.boundary(TS.lineBuffer(line)(width / 2)),
    TS.pointBuffer(TS.startPoint(line))(width / 2),
    TS.pointBuffer(TS.endPoint(line))(width / 2)
  ]))

  return [
    styles.dashedLine(geometries[1]),
    styles.solidLine(geometries[2])
  ]
}

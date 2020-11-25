import * as TS from '../../ts'

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.FRDESY
 * FORD EASY
 */
export default options => {
  const { styles, width, line } = options

  return styles.dashedLine(TS.difference([
    TS.boundary(TS.lineBuffer(line)(width / 2)),
    TS.pointBuffer(TS.startPoint(line))(width / 2),
    TS.pointBuffer(TS.endPoint(line))(width / 2)
  ]))
}

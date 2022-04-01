import * as TS from '../../ts'

/**
 * TACGRP.TSK.HOP
 * TASKS / HOLD OPEN (AUT ONLY)
 */
export default options => {
  const { styles, width, line } = options


  return [
    styles.solidLine(TS.collect([
      TS.difference([
        TS.boundary(TS.lineBuffer(line)(width / 2)),
        TS.pointBuffer(TS.endPoint(line))(width / 6),
        TS.pointBuffer(TS.startPoint(line))(width / 6)
      ])
    ]))
  ]
}

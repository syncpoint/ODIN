import * as R from 'ramda'
import * as TS from '../../ts'

/**
 * TACGRP.C2GM.OFF.ARS.AFP
 * ATTACK BY FIRE POSITION
 */
export default options => {
  const { styles, width, line, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)

  const parts = [
    () => line,
    () => {
      const project = TS.projectCoordinates(width / 2, segment.angle(), coords[0])
      const ps = project([[-0.25, 1.25], [0, 1], [0, -1], [-0.25, -1.25]])
      return TS.lineString(R.props([0, 1, 2, 3], ps))
    },
    () => {
      const project = TS.projectCoordinates(resolution * 8, segment.angle(), coords[1])
      const ps = project([[-1, 0.75], [0, 0], [-1, -0.75]])
      return TS.lineString(R.props([0, 1, 2], ps))
    }
  ]

  return styles.solidLine(TS.collect(parts.map(part => part())))
}

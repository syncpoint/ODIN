import * as R from 'ramda'
import * as TS from '../../ts'

const pc = TS.projectCoordinates

/**
 * TACGRP.TSK.CNZ
 * TASKS / CANALIZE
 */
export default options => {
  const { styles, width, line, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const [p0, p1] = pc(width / 2, angle, coords[1])([[0, 1], [0, -1]])
  const distance = resolution * 7

  return [
    styles.solidLine(TS.collect([
      TS.difference([
        TS.boundary(TS.lineBuffer(line)(width / 2)),
        TS.pointBuffer(TS.endPoint(line))(width / 2)
      ]),
      TS.lineString(R.props([0, 1], pc(distance, angle, p0)([[-1, -1], [1, 1]]))),
      TS.lineString(R.props([0, 1], pc(distance, angle, p1)([[-1, 1], [1, -1]])))
    ])),
    styles.text(TS.startPoint(line), {
      text: 'C',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}

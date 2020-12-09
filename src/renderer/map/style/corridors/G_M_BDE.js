import * as TS from '../../ts'
import { closedArrow } from './arrow'

/**
 * TACGRP.MOBSU.OBSTBP.DFTY.ESY
 * BYPASS EASY
 */
export default options => {
  const { styles, width, line, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const arrows = TS
    .projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
    .map(point => closedArrow(resolution, angle, point))

  return [
    styles.filledPolygon(TS.union(arrows)),
    styles.solidLine(TS.difference([
      TS.boundary(TS.lineBuffer(line)(width / 2)),
      TS.pointBuffer(TS.endPoint(line))(width / 2),
      ...arrows
    ]))
  ]
}

import * as TS from '../../ts'
import { closedArrow } from './arrow'

/**
 * TACGRP.MOBSU.OBSTBP.DFTY.IMP
 * BYPASS IMPOSSIBLE
 */
export default options => {
  const { styles, width, line, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const arrows = TS
    .projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
    .map(point => closedArrow(resolution, angle, point))

  const distance = resolution * 8
  const d = 1 / Math.sqrt(2)
  const [p00, p01, p10, p11] = TS.projectCoordinates(distance, angle, coords[0])(
    [[-d, d], [d, d], [-d, -d], [d, -d]]
  )

  return [
    styles.filledPolygon(TS.union(arrows)),
    styles.solidLine(TS.collect([
      TS.difference([
        TS.boundary(TS.lineBuffer(line)(width / 2)),
        TS.pointBuffer(TS.endPoint(line))(width / 2),
        TS.pointBuffer(TS.startPoint(line))(distance),
        ...arrows
      ]),
      TS.lineString([p00, p01]),
      TS.lineString([p10, p11])
    ]))
  ]
}

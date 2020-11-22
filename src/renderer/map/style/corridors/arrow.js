import * as R from 'ramda'
import * as TS from '../../ts'

export const arrowCoordinates = (width, line) => {
  const [p0, p1] = R.last(R.aperture(2, TS.coordinates([line])))
  const segment = TS.lineSegment([p0, p1])
  const angle = segment.angle()

  return xs => xs
    .map(([dx, dy]) => [-dx * width, dy * width])
    .map(([dx, dy]) => [Math.sqrt(dx * dx + dy * dy), angle - Math.atan2(dy, dx)])
    .map(([c, α]) => new TS.Coordinate(p1.x + Math.cos(α) * c, p1.y + Math.sin(α) * c))
}

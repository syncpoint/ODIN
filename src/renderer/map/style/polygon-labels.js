import * as R from 'ramda'
import * as math from 'mathjs'
import * as geom from 'ol/geom'
import * as style from 'ol/style'
import { containsXY } from 'ol/extent'
import { defaultFont } from './default-style'

/**
 * segmentIntersect :: ([x, y], [x, y]) -> [[x0, y0], [x1, y1]] -> [x, y]
 * Intersection point of two line segments yz and segment.
 */
const segmentIntersect = (y, z) => segment => {
  const intersection = math.intersect(segment[0], segment[1], y, z)
  if (!intersection) return []
  const extent = new geom.LineString(segment).getExtent()
  if (!containsXY(extent, intersection[0], intersection[1])) return []
  return [intersection]
}

/**
 * axisIntersect :: ([[x, y]], [x, y], [x, y]) -> [[x, y]] -> [[x, y]]
 * Maximum of two intersection points of line segment yz
 * with all segments formed by points.
 */
export const axisIntersect = (points, y, z) => R
  .aperture(2, points)
  .map(segment => segmentIntersect(y, z)(segment))
  .reduce((acc, intersections) => acc.concat(intersections), [])


export const placements = geometry => {
  const ring = geometry.getLinearRing(0)
  const box = ring.getExtent()
  const coords = ring.getCoordinates()
  const center = geometry.getInteriorPoint()
  const C = center.getCoordinates() // XYM layout
  const points = {}

  const northEW = () => {
    const y = box[1] + (box[3] - box[1]) * 0.95
    const xs = axisIntersect(coords, [box[0], y], [box[2], y])
    if (xs.length === 2) {
      points.northEast = () => new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1])
      points.northWest = () => new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
    } else {
      delete points.northEast
      delete points.northWest
    }
  }

  const hIntersect = () => {
    const xs = axisIntersect(coords, [box[0], C[1]], [box[2], C[1]])
    if (xs.length === 2) {
      points.east = () => new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1])
      points.west = () => new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
    } else {
      delete points.east
      delete points.west
    }
  }

  const vIntersect = () => {
    const xs = axisIntersect(coords, [C[0], box[1]], [C[0], box[3]])
    if (xs.length === 2) {
      points.south = () => new geom.Point(xs[0][1] > xs[1][1] ? xs[1] : xs[0])
      points.north = () => new geom.Point(xs[0][1] > xs[1][1] ? xs[0] : xs[1])
    } else {
      delete points.south
      delete points.north
    }
  }

  points.center = () => geometry.getInteriorPoint()
  points.footer = () => new geom.Point([C[0], box[1]])
  points.northEast = () => { northEW(); return points.northEast() }
  points.northWest = () => { northEW(); return points.northWest() }
  points.east = () => { hIntersect(); return points.east() }
  points.west = () => { hIntersect(); return points.west() }
  points.south = () => { vIntersect(); return points.south() }
  points.north = () => { vIntersect(); return points.north() }

  return points
}

export const textStyle = ({ geometry, text, options }) => new style.Style({
  geometry,
  text: new style.Text({
    text,
    font: defaultFont,
    stroke: new style.Stroke({ color: 'white', width: 3 }),
    ...options
  })
})

const axisLabels = (axis, options = {}) =>
  lines =>
    context =>
      properties => {
        const text = lines(properties).filter(x => x).join('\n')
        if (!text) return []
        return axis.map(point => textStyle({ geometry: context[point], text, options }))
      }

export const c = axisLabels(['center'])
export const n = axisLabels(['north'])
export const ns = axisLabels(['north', 'south'])
export const nw = axisLabels(['northWest'], { textAlign: 'right', offsetX: -20 })
export const nsew = axisLabels(['north', 'south', 'east', 'west'])
export const ew = axisLabels(['east', 'west'])
export const f = axisLabels(['footer'], { offsetY: 20 })

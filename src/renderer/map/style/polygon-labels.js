import * as R from 'ramda'
import * as math from 'mathjs'
import * as geom from 'ol/geom'
import * as style from 'ol/style'
import { containsXY } from 'ol/extent'
import { defaultFont } from './font'

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
const axisIntersect = (points, y, z) => R
  .aperture(2, points)
  .map(segment => segmentIntersect(y, z)(segment))
  .reduce((acc, intersections) => acc.concat(intersections), [])


/**
 * directionalPlacements :: ol/geom/Polygon -> string ~> [x, y]
 * Named placement points on polygon.
 * Supported placements: center, east, west, north, south
 */
export const directionalPlacements = polygon => {
  if (!(polygon instanceof geom.Polygon)) return

  const ring = polygon.getLinearRing(0)
  const box = ring.getExtent()
  const points = ring.getCoordinates()
  const center = polygon.getInteriorPoint()
  const C = center.getCoordinates() // XYM layout

  const hIntersect = () => {
    const xs = axisIntersect(points, [box[0], C[1]], [box[2], C[1]])
    return xs.length !== 2 ? {} : {
      east: new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1]),
      west: new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
    }
  }

  const vIntersect = () => {
    const xs = axisIntersect(points, [C[0], box[1]], [C[0], box[3]])
    return xs.length !== 2 ? {} : {
      south: new geom.Point(xs[0][1] > xs[1][1] ? xs[1] : xs[0]),
      north: new geom.Point(xs[0][1] > xs[1][1] ? xs[0] : xs[1])
    }
  }

  const northEW = () => {
    const y = box[1] + (box[3] - box[1]) * 0.95
    const xs = axisIntersect(points, [box[0], y], [box[2], y])
    return xs.length !== 2 ? {} : {
      northEast: new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1]),
      northWest: new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
    }
  }

  const footer = () => ({
    footer: new geom.Point([C[0], box[1]])
  })

  return { center, ...hIntersect(), ...vIntersect(), ...northEW(), ...footer() }
}

const textStyle = ({ geometry, text, options }) => new style.Style({
  geometry,
  text: new style.Text({
    text,
    font: defaultFont,
    stroke: new style.Stroke({ color: 'white', width: 3 }),
    ...options
  })
})

const axisLabels = (axes, options = {}) => lines => feature => {
  const placements = directionalPlacements(feature.getGeometry())
  const text = lines(feature.getProperties()).filter(x => x).join('\n')

  return axes
    .map(axis => ({ text, geometry: placements[axis], options }))
    .filter(({ geometry }) => {
      if (!geometry) console.log('no geometry', feature)
      return geometry
    })
    .map(textStyle)
}

export const nsewLabel = axisLabels(['north', 'south', 'east', 'west'])
export const ewLabels = axisLabels(['east', 'west'])
export const nsLabels = axisLabels(['north', 'south'])
export const southLabel = axisLabels(['south'])
export const northLabel = axisLabels(['north'])
export const centerLabel = axisLabels(['center'])
export const nwLabel = axisLabels(['northWest'], { textAlign: 'right', offsetX: -20 })
export const footerLabel = axisLabels(['footer'], { offsetY: 20 })

import L from 'leaflet'
import * as math from 'mathjs'
import * as R from 'ramda'
import { svgBuilder } from './svg-builder'

const axisIntersect = (points, y, z) => R.aperture(2, points).reduce((acc, segment) => {
  const w = [segment[0].x, segment[0].y]
  const x = [segment[1].x, segment[1].y]
  const intersection = math.intersect(w, x, y, z)
  if (!intersection) return acc

  const point = L.point(intersection[0], intersection[1])
  if (L.bounds(segment).contains(point)) acc.push(point)
  return acc
}, [])

const placements = ({ rings }) => {
  const ring = rings[0]
  const bounds = L.bounds(ring)
  const centroid = L.Point.centroid(ring)
  const placements = { center: centroid }

  const hIntersect = () => {
    const points = axisIntersect(ring, [bounds.min.x, centroid.y], [bounds.max.x, centroid.y])
    if (points.length !== 2) return {}
    return {
      east: points[0].x > points[1].x ? points[0] : points[1],
      west: points[0].x > points[1].x ? points[1] : points[0]
    }
  }

  const vIntersect = () => {
    const points = axisIntersect(ring, [centroid.x, bounds.min.y], [centroid.x, bounds.max.y])
    if (points.length !== 2) return {}
    return {
      north: points[0].y > points[1].y ? points[1] : points[0],
      south: points[0].y > points[1].y ? points[0] : points[1]
    }
  }

  // TODO: calculate axis intersections only when needed
  Object.entries(hIntersect()).forEach(([key, value]) => (placements[key] = value))
  Object.entries(vIntersect()).forEach(([key, value]) => (placements[key] = value))

  return placements
}

export const polygonShape = (group, options) => {
  const state = { options }

  const builder = svgBuilder(options, {
    placements,
    points: ({ rings }) => rings,
    closed: () => true,
    style: name => state.options.stylesX[name],
    labels: () => state.options.labels
  })

  return {
    attached: () => builder.attach(group),
    updateFrame: builder.updateFrame,
    updateOptions: options => {
      state.options = options
      builder.refresh()
    }
  }
}

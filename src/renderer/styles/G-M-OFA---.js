import * as R from 'ramda'
import * as math from 'mathjs'
import * as geom from 'ol/geom'
import { containsXY } from 'ol/extent'
import { LineString, Point, Stroke, Style, Text } from './predef'
import tacgrp from './tacgrp'

const segmentIntersect = (y, z) => segment => {
  const intersection = math.intersect(segment[0], segment[1], y, z)
  if (!intersection) return []
  const extent = LineString.of(segment).getExtent()
  if (!containsXY(extent, intersection[0], intersection[1])) return []
  return [intersection]
}

const axisIntersect = (points, y, z) => R
  .aperture(2, points)
  .map(segment => segmentIntersect(y, z)(segment))
  .reduce((acc, intersections) => acc.concat(intersections), [])


const directionalPlacements = polygon => {
  if (!(polygon instanceof geom.Polygon)) return

  const ring = polygon.getLinearRing(0)
  const box = ring.getExtent()
  const points = ring.getCoordinates()
  const C = polygon.getInteriorPoint().getCoordinates()

  const hIntersect = () => {
    const xs = axisIntersect(points, [box[0], C[1]], [box[2], C[1]])
    return xs.length !== 2 ? {} : {
      east: Point.of(xs[0][0] > xs[1][0] ? xs[0] : xs[1]),
      west: Point.of(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
    }
  }

  const vIntersect = () => {
    const xs = axisIntersect(points, [C[0], box[1]], [C[0], box[3]])
    return xs.length !== 2 ? {} : {
      north: Point.of(xs[0][1] > xs[1][1] ? xs[1] : xs[0]),
      south: Point.of(xs[0][1] > xs[1][1] ? xs[0] : xs[1])
    }
  }

  return { ...hIntersect(), ...vIntersect() }
}

const textStyle = ({ geometry, text }) => Style.of({
  geometry,
  text: Text.of({
    text,
    font: '16px sans-serif',
    stroke: Stroke.of({ color: 'white', width: 3 })
  })
})

tacgrp['G-M-OFA---'] = {
  labels: feature => {
    const labels = text => xs => xs.map(placement => ({ text, placement }))
    const placements = directionalPlacements(feature.getGeometry())
    return labels('M')(['east', 'west', 'north', 'south'])
      .map(({ placement, text }) => ({ geometry: placements[placement], text }))
      .filter(({ geometry }) => geometry)
      .map(textStyle)
  }
}

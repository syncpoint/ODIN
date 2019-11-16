import * as R from 'ramda'
import LatLon from 'geodesy/latlon-spherical.js'


/**
 *
 */
export const Point = {}

Point.lonLat = point => [point.lon, point.lat]


/**
 *
 */
export const Line = {}

Line.of = points => {
  const a = new LatLon(points[0][1], points[0][0])
  const b = new LatLon(points[1][1], points[1][0])
  const initialBearing = a.initialBearingTo(b)
  const finalBearing = a.finalBearingTo(b)
  return { a, b, initialBearing, finalBearing, distance: a.distanceTo(b) }
}

Line.translate = (distance, bearing) => line => {
  const a = line.a.destinationPoint(distance, line.initialBearing + bearing)
  const b = line.b.destinationPoint(distance, line.finalBearing + bearing)
  const initialBearing = a.initialBearingTo(b)
  const finalBearing = a.finalBearingTo(b)
  return { a, b, initialBearing, finalBearing, distance: a.distanceTo(b) }
}

Line.points = line => [Point.lonLat(line.a), Point.lonLat(line.b)]

Line.intersection = lines => Point.lonLat(LatLon.intersection(
  lines[0].a, lines[0].initialBearing,
  lines[1].b, lines[1].finalBearing + 180
))

Line.intersections = lines => R.aperture(2, lines).map(Line.intersection)

Line.point = f => line => {
  const bearing = (line.initialBearing + line.finalBearing) / 2
  return Point.lonLat(line.a.destinationPoint(f * line.distance, bearing))
}

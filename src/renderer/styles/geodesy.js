import * as R from 'ramda'
import LatLon from 'geodesy/latlon-spherical.js'


/**
 *
 */
export const Point = {}

Point.lonLat = ({ lon, lat }) => [lon, lat]


/**
 *
 */
export const Line = {}

Line.of = ([A, B]) => {
  const a = new LatLon(A[1], A[0])
  const b = new LatLon(B[1], B[0])
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

Line.intersectionPoint = R.compose(Point.lonLat, LatLon.intersection)

Line.intersection = ([A, B]) =>
  Line.intersectionPoint(A.a, A.initialBearing, B.b, B.finalBearing + 180)

Line.intersections = lines => R.aperture(2, lines).map(Line.intersection)

// Interpolate line point.
Line.point = f => line => {
  const bearing = (line.initialBearing + line.finalBearing) / 2
  return Point.lonLat(line.a.destinationPoint(f * line.distance, bearing))
}

import * as R from 'ramda'
import { getTransform } from 'ol/proj'
import Feature from 'ol/Feature'
import LatLon from 'geodesy/latlon-spherical.js'
import { T } from '../../../shared/combinators'

export const toEPSG4326 = getTransform('EPSG:3857', 'EPSG:4326')
export const toEPSG3857 = getTransform('EPSG:4326', 'EPSG:3857')

/** toLatLon :: [number, number] -> geodesy/latlon-spherical */
export const toLatLon = p => T(toEPSG4326(p))(([lon, lat]) => new LatLon(lat, lon))

/** fromLatLon :: geodesy/latlon-spherical -> [number, number] */
export const fromLatLon = ({ lat, lon }) => toEPSG3857([lon, lat])

/**
 * bearings :: [geodesy/latlon-spherical, geodesy/latlon-spherical] -> [number, number]
 * Initial and final bearing of segment of first two line points.
 */
export const bearings = ([a, b]) => ([a.initialBearingTo(b), a.finalBearingTo(b)])

/** initialBearing :: [geodesy/latlon-spherical, geodesy/latlon-spherical] -> number */
export const initialBearing = ([a, b]) => a.initialBearingTo(b)

/** finalBearing :: [geodesy/latlon-spherical, geodesy/latlon-spherical] -> number */
export const finalBearing = ([a, b]) => a.finalBearingTo(b)

/** distance :: [geodesy/latlon-spherical, geodesy/latlon-spherical] -> number */
export const distance = ([a, b]) => a.distanceTo(b)

/**
 * bearingLine :: [geodesy/latlon-spherical, geodesy/latlon-spherical] -> [number, number]
 * Initial bearing and distance of segment of first two line points.
 */
export const bearingLine = ([a, b]) => [a.initialBearingTo(b), a.distanceTo(b)]

/**
 * orientation :: (geodesy/latlon-spherical, [geodesy/latlon-spherical, geodesy/latlon-spherical]) -> [1 | -1]
 * Orientation of point in respect to segment of first two line points.
 */
export const orientation = (x, [a, b]) => Math.sign(x.crossTrackDistanceTo(a, b))

/**
 * destinationPoint ::
 *    (number, number) ->
 *    [number, geodesy/latlon-spherical] -> geodesy/latlon-spherical ->
 *    geodesy/latlon-spherical
 *
 * Projected point of bearing line with additional delta bearing.
 */
export const destinationPoint =
  (distance, bearing) => ([point, deltaBearing]) =>
    point.destinationPoint(distance, deltaBearing + bearing)

/**
 * translateLine ::
 *    (number, number) ->
 *    [geodesy/latlon-spherical, geodesy/latlon-spherical] ->
 *    [geodesy/latlon-spherical, geodesy/latlon-spherical]
 */
export const translateLine =
  (distance, bearing) => line =>
    R.zip(line, bearings(line))
      .map(destinationPoint(distance, bearing))

/**
 * coordinates :: (ol/Feature | ol/geom/Geometry) -> [[number, number]]
 */
export const coordinates = object =>
  object instanceof Feature
    ? coordinates(object.getGeometry())
    : object.getCoordinates()

/**
 * wrap360 :: number -> number
 */
export const wrap360 = degrees => {
  if (degrees >= 0 && degrees < 360) return degrees
  return (degrees % 360 + 360) % 360 // sawtooth wave p:360, a:360
}

export const mirrorPoints = ([A, B]) => {
  return [new LatLon(A.lat, B.lon), new LatLon(B.lat, A.lon)]
}

export const segmentizeLine = ([A, B], resolution, fac = 5) => {
  const [bearing, distance] = bearingLine([A, B])
  const delta = distance / (distance / resolution) * fac
  return R.range(1, distance / delta).map(i => A.destinationPoint(i * delta, bearing))
}

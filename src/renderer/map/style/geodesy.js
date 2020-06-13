import * as R from 'ramda'
import { getTransform } from 'ol/proj'
import LatLon from 'geodesy/latlon-spherical.js'
import { T } from '../../../shared/combinators'

export const toEPSG4326 = getTransform('EPSG:3857', 'EPSG:4326')
export const toEPSG3857 = getTransform('EPSG:4326', 'EPSG:3857')
export const toLatLon = p => T(toEPSG4326(p))(([lon, lat]) => new LatLon(lat, lon))
export const fromLatLon = ({ lat, lon }) => toEPSG3857([lon, lat])

export const bearings = ([a, b]) => ([a.initialBearingTo(b), a.finalBearingTo(b)])
export const distance = ([a, b]) => a.distanceTo(b)

export const destinationPoint =
  (distance, bearing) => ([point, deltaBearing]) =>
    point.destinationPoint(distance, deltaBearing + bearing)

export const translateLine =
  (distance, bearing) => line =>
    R.zip(line, bearings(line))
      .map(destinationPoint(distance, bearing))

export const coordinates = feature => feature.getGeometry().getCoordinates()

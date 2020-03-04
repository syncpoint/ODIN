/* eslint-disable */

import * as GEOS from '@syncpoint/geosjs'
import { Geodesic } from 'geographiclib'
import proj4 from 'proj4'

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI
const HALF_PI = Math.PI / 2
const proj = proj4('EPSG:4326', 'EPSG:3857')
const radians = deg => deg * DEG2RAD
const geod = Geodesic.WGS84

const InverseRadians = (A, B) => {
  const r = geod.Inverse(A.getY(), A.getX(), B.getY(), B.getX())
  return {
    azimuth: r.azi1 * DEG2RAD,
    distanceSphere: r.s12
  }
}

const DirectRadians = (A, distance, azimuth) => {
  const r = geod.Direct(A.getY(), A.getX(), azimuth * RAD2DEG, distance)
  return { x: r.lon2, y: r.lat2 }
}

const projectPoint = (point, distance, azimuth) => {
  const { x, y } = DirectRadians(point, distance, azimuth)
  return GEOS.createPoint(x, y)
}

export {
  GEOS,
  HALF_PI,
  InverseRadians,
  proj,
  radians,
  projectPoint
}

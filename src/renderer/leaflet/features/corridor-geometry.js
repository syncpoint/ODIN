import L from 'leaflet'
import * as R from 'ramda'
import { intersect } from '../geodesy'

/**
 * WG84 center line and envelope of
 * 2- or n-point corridor for given width in meters.
 */
export const corridorGeometry = (latlngs, width) => {
  const segments = R.aperture(2, latlngs).map(L.LatLng.line)
  const s1 = segments[0]
  const sn = segments[segments.length - 1]

  const envelope = (factor = 1) => {
    const w = (width * factor) / 2
    const [right, left] = segments.reduce((acc, line) => {
      acc[0].push(line.translate(w, 90))
      acc[1].push(line.translate(w, -90))
      return acc
    }, [[], []])


    // FIXME: lines do not intersect when angle is 180°
    return R.zip([
      s1.points[0].destinationPoint(w, s1.initialBearing + 90),
      ...R.aperture(2, right).map(intersect),
      sn.points[1].destinationPoint(w, sn.finalBearing + 90)
    ], [
      s1.points[0].destinationPoint(w, s1.initialBearing - 90),
      ...R.aperture(2, left).map(intersect),
      sn.points[1].destinationPoint(w, sn.finalBearing - 90)
    ])
  }

  return {
    latlngs,
    width,
    envelope
  }
}

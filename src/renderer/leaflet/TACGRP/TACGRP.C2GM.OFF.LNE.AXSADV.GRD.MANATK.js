import L from 'leaflet'
import * as R from 'ramda'
import GeoJSON from '../GeoJSON'

const intersect = lines => lines[0].intersection(lines[1])
const unzip = n => xs => xs.reduce((acc, x) => {
  R.range(0, n).forEach(i => acc[i].push(x[i]))
  return acc
}, R.range(0, n).map(_ => []))

const corridor = (latlngs, width) => {
  const median = R.aperture(2, latlngs).map(L.LatLng.line)
  const m1 = median[0]
  const mn = median[median.length - 1]

  // MIL-STD-2525C: P0 is at arrow's tip.
  // MIL-STD-2525C: Width is defined through arrow (not corridor) width

  const envelope = (factor = 1) => {
    const w = width * factor
    const [right, left] = median.reduce((acc, line) => {
      acc[0].push(line.translate(w, 90))
      acc[1].push(line.translate(w, -90))
      return acc
    }, [[], []])

    return R.zip([
      m1.points[0].destinationPoint(w, m1.initialBearing + 90),
      ...R.aperture(2, right).map(intersect),
      mn.points[1].destinationPoint(w, mn.finalBearing + 90)
    ], [
      m1.points[0].destinationPoint(w, m1.initialBearing - 90),
      ...R.aperture(2, left).map(intersect),
      mn.points[1].destinationPoint(w, mn.finalBearing - 90)
    ])
  }

  return {
    latlngs,
    width,
    envelope
  }
}

/* eslint-disable */

L.Feature['G*G*OLAGM-'] = (feature, options) => {
  const latlngs = GeoJSON.latlng(feature.geometry)
  const width = feature.geometry.width
  const layers = envelope => L.layerGroup([
    L.geoJSON(feature),
    L.polyline(envelope[0]), L.polyline(envelope[1])
  ])

  return layers(unzip(2)(corridor(latlngs, width).envelope()))
}

import L from 'leaflet'
import * as R from 'ramda'
import '../geodesy'
import '../CorridorNPoint'

const last = xs => xs[xs.length - 1]
const intersection = lines => lines[0].intersection(lines[1])

L.Feature['G*T*K-----'] = L.CorridorNPoint.extend({
  style: {
    'stroke-dasharray': '10 5'
  },

  path (geometry) {
    const { latlngs, width } = geometry
    const points = [...latlngs]
    const lastPoint = last(points)
    const bearing = points[points.length - 2].finalBearingTo(last(points))
    points[points.length - 1] = last(points).destinationPoint(-width * 1, bearing)

    const centerLine = R.aperture(2, points).map(L.LatLng.line)
    const halfWidth = width / 2
    const frame = centerLine.map(line => ([
      line.translate(halfWidth, 90),
      line.translate(halfWidth, -90)
    ]))

    // single connected line string:
    const lineString = [
      // first part of frame up to arrow:
      frame[0][0].points[0],
      ...R.aperture(2, frame.map(border => border[0])).map(intersection),
      last(frame)[0].points[1],

      // arrow:
      last(frame)[0].points[1].destinationPoint(
        0.7 * width, last(centerLine).finalBearing + 90
      ),
      lastPoint,
      last(frame)[1].points[1].destinationPoint(
        0.7 * width, last(centerLine).finalBearing - 90
      ),

      // second part of frame from arrow to beginning:
      last(frame)[1].points[1],
      ...R.aperture(2, frame.map(border => border[1])).map(intersection).reverse(),
      frame[0][1].points[0]
    ]

    return [lineString]
  }
})

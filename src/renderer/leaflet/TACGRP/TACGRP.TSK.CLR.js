import L from 'leaflet'
import * as R from 'ramda'
import '../Corridor2Point'

L.Feature['G*T*X-----'] = L.Corridor2Point.extend({
  path ({ A, B, width, initialBearing, finalBearing }) {
    const distance = A.distanceTo(B)

    const path = [
      [ A.destinationPoint(width / 2.7, initialBearing + 90), B.destinationPoint(width / 2.7, finalBearing + 90) ],
      [ A, B ],
      [ A.destinationPoint(width / 2.7, initialBearing - 90), B.destinationPoint(width / 2.7, finalBearing - 90) ],
      [ B.destinationPoint(width / 2, finalBearing - 90), B.destinationPoint(width / 2, finalBearing + 90) ]
    ]

    // Arrows.
    const length = Math.min(distance / 10, width / 5)
    R.range(0, 3).forEach(i => path.push(L.Shape.arrow(path[i][1], length, finalBearing)))

    return path
  },

  label ({ A, B, initialBearing }) {
    const distance = A.distanceTo(B)
    const latlng = A.destinationPoint(distance / 2, initialBearing)
    return { text: 'C', latlng, bearing: initialBearing }
  }
})

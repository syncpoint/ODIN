import L from 'leaflet'
import * as R from 'ramda'
import '../Corridor2Point'

L.Feature['G*T*T-----'] = L.Corridor2Point.extend({
  path ({ A, A1, A2, B, B1, B2, width, initialBearing, finalBearing }) {
    const distance = A.distanceTo(B)

    const path = [
      [ A2, B2 ],
      [ A.destinationPoint(-distance / 3, initialBearing), B.destinationPoint(-distance / 3, finalBearing) ],
      [ A1, B1.destinationPoint(-distance / 3 * 2, finalBearing) ],
      [ A1, A2 ]
    ]

    // Arrows.
    const length = Math.min(distance / 10, width / 3)
    R.range(0, 3).forEach(i => path.push(L.Shape.arrow(path[i][1], length, finalBearing)))

    return path
  },

  label ({ A, B, initialBearing }) {
    const distance = A.distanceTo(B)
    const latlng = A.destinationPoint(distance / 3, initialBearing)
    return { text: 'D', latlng, bearing: initialBearing }
  }
})

import L from 'leaflet'
import '../Corridor2Point'

L.Feature['G*T*P-----'] = L.Corridor2Point.extend({
  path ({ A, A1, A2, B, B1, B2, finalBearing }) {
    const path = [[A, B], [B1, B2]]
    const length = A1.distanceTo(A2) / 10
    path.push(L.Shape.arrow(path[0][1], length, finalBearing))
    return path
  },

  label ({ A, B, initialBearing }) {
    const distance = A.distanceTo(B)
    const latlng = A.destinationPoint(distance / 2, initialBearing)
    return { text: 'P', latlng, bearing: initialBearing }
  }
})

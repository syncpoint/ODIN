import L from 'leaflet'
import '../Corridor2Point'

L.Feature['G*T*B-----'] = L.Corridor2Point.extend({
  path ({ A, B, B1, B2 }) {
    return [[A, B], [B1, B2]]
  },
  label ({ A, B, initialBearing }) {
    const distance = A.distanceTo(B)
    const latlng = A.destinationPoint(distance / 2, initialBearing)
    return { text: 'B', latlng, bearing: initialBearing }
  }
})

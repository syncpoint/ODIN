import L from 'leaflet'
import '../Line2Point'

L.Feature['G*T*F-----'] = L.Line2Point.extend({
  path ({ A, B, initialBearing, finalBearing }) {

    // Split line in 3 segments: 25%, 50% and 25%.
    const length = A.distance(B)
    const C = A.destinationPoint(length * 0.25, initialBearing)
    const D = B.destinationPoint(length * -0.25, finalBearing)

    const width = length / 5
    const path = [ A, C ]
    for (let i = 0; i < 8; i++) {
      const angle = i % 2 ? 90 : -90
      const distance = (length / 2) / 8 * (i + 1) - (length / 32)
      const point = C
        .destinationPoint(distance, initialBearing)
        .destinationPoint(width / 2, initialBearing + angle)
      path.push(point)
    }

    path.push(D, B)

    const arrow = L.Shape.arrow(B, width / 2, finalBearing)

    return [path, [...arrow]]
  },

  label ({ A, B, initialBearing }) {
    const length = A.distanceTo(B)
    const latlng = A.destinationPoint(length * 0.125, initialBearing)
    return { text: 'F', latlng, bearing: initialBearing }
  }
})

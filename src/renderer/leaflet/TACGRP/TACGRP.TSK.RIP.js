import L from 'leaflet'
import '../Orbit'

L.Feature['G*T*R-----'] = L.Orbit.extend({

  path ({ A, A1, B, B1, width, offset, initialBearing, finalBearing }) {
    const center = B.destinationPoint(width / 2, initialBearing + offset)
    const orientAngle = initialBearing - 90
    const arc = []
    const sizeAngle = 180

    for (let angle = orientAngle; angle <= orientAngle + sizeAngle; angle += (180 / 32)) {
      arc.push(center.destinationPoint(width / 2, angle))
    }

    const length = A.distance(B)
    const arrows = [
      L.Shape.arrow(B, length / 6, finalBearing),
      L.Shape.arrow(A1, -length / 6, initialBearing)
    ]

    return [[...arc], [A, B], [B1, A1], ...arrows]
  },

  labelCount: 1,

  label ({ A, B, initialBearing, finalBearing }) {
    const length = A.distance(B)

    return [{
      text: 'RIP',
      latlng: A.destinationPoint(length / 2, initialBearing),
      bearing: finalBearing
    }]
  }
})

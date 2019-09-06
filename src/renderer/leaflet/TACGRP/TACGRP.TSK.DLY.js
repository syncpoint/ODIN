import L from 'leaflet'
import '../Orbit'

L.Feature['G*T*L-----'] = L.Orbit.extend({

  path ({ A, B, width, offset, initialBearing, finalBearing }) {
    const center = A.destinationPoint(width / 2, initialBearing + offset)
    const orientAngle = initialBearing + 90
    const arc = []
    const sizeAngle = 180

    for (let angle = orientAngle; angle <= orientAngle + sizeAngle; angle += (180 / 32)) {
      arc.push(center.destinationPoint(width / 2, angle))
    }

    const length = A.distance(B)
    const arrow = L.Shape.arrow(B, length / 6, finalBearing)
    return [[...arc], [A, B], [...arrow]]
  },

  labelCount: 1,
  labelText: 'D',

  label ({ A, B, initialBearing, finalBearing }) {
    const length = A.distance(B)

    return [{
      text: this.labelText,
      latlng: A.destinationPoint(length / 2, initialBearing),
      bearing: finalBearing
    }]
  }
})

L.Feature['G*T*W-----'] = L.Feature['G*T*L-----'].extend({
  labelText: 'W'
})

L.Feature['G*T*WP----'] = L.Feature['G*T*L-----'].extend({
  labelText: 'WP'
})

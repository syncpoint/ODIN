import L from 'leaflet'
import '../Arc'
import { wrap360 } from '../geodesy'

L.Feature['G*T*O-----'] = L.Arc.extend({

  sizeAngle: 338,

  path ({ C, orientAngle, radius }) {
    const arc = []
    for (let angle = orientAngle; angle <= orientAngle + this.sizeAngle; angle += (180 / 16)) {
      arc.push(C.destinationPoint(radius, angle))
    }

    // Cross.
    const bearing = arc[arc.length - 2].finalBearingTo(arc[arc.length - 1])
    const cross = [
      [
        arc[arc.length - 1].destinationPoint(radius / 6, bearing - 45),
        arc[arc.length - 1].destinationPoint(radius / 6, bearing + 135)
      ],
      [
        arc[arc.length - 1].destinationPoint(radius / 6, bearing + 45),
        arc[arc.length - 1].destinationPoint(radius / 6, bearing - 135)
      ]
    ]

    return [arc, ...cross]
  },

  label ({ C, orientAngle, radius }) {
    const latlng = C.destinationPoint(radius, orientAngle + this.sizeAngle / 2)
    const bearing = wrap360(orientAngle + this.sizeAngle / 2)
    return { text: 'O', latlng, bearing }
  }
})

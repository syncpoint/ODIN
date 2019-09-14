import L from 'leaflet'
import '../Arc'
import { wrap360 } from '../geodesy'

L.Feature['G*T*S-----'] = L.Arc.extend({

  sizeAngle: 338,

  path ({ C, orientAngle, radius }) {
    const arc = []
    for (let angle = orientAngle; angle <= orientAngle + this.sizeAngle; angle += (180 / 16)) {
      arc.push(C.destinationPoint(radius, angle))
    }

    const anchor = arc[arc.length - 1]
    const bearing = arc[arc.length - 2].finalBearingTo(arc[arc.length - 1])
    const arrow = L.Shape.arrow(anchor, radius / 6, bearing)

    return [arc, arrow]
  },

  label ({ C, orientAngle, radius }) {
    const latlng = C.destinationPoint(radius, orientAngle + this.sizeAngle / 2)
    const bearing = wrap360(orientAngle + this.sizeAngle / 2)
    return { text: 'S', latlng, bearing }
  }
})

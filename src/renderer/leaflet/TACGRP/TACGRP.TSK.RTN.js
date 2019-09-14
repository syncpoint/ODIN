import L from 'leaflet'
import '../Arc'
import { wrap360 } from '../geodesy'

L.Feature['G*T*Q-----'] = L.Arc.extend({

  sizeAngle: 338,

  path ({ C, orientAngle, radius }) {
    const innerArc = []
    const outerArc = []
    for (let angle = orientAngle; angle <= orientAngle + this.sizeAngle; angle += (180 / 16)) {
      innerArc.push(C.destinationPoint(radius, angle))
      outerArc.push(C.destinationPoint(radius * 1.2, angle))
    }

    const spikes = []
    for (let i = 1; i < innerArc.length - 1; i++) {
      spikes.push([innerArc[i], outerArc[i]])
    }

    const anchor = innerArc[innerArc.length - 1]
    const bearing = innerArc[innerArc.length - 2].finalBearingTo(innerArc[innerArc.length - 1])
    const arrow = L.Shape.arrow(anchor, radius / 6, bearing)

    return [innerArc, ...spikes, arrow]
  },

  label ({ C, O, orientAngle, radius }) {
    const latlng = C.destinationPoint(radius, orientAngle + this.sizeAngle / 2)
    const bearing = wrap360(orientAngle + this.sizeAngle / 2)
    return { text: 'R', latlng, bearing }
  }
})

import L from 'leaflet'
import '../Arc'
import { wrap360 } from '../geodesy'

L.Feature['G*T*E-----'] = L.Arc.extend({

  sizeAngle: 330,

  path ({ C, orientAngle, radius }) {
    const outerArc = []
    const innerArc = []
    for (let angle = orientAngle; angle <= orientAngle + this.sizeAngle; angle += (180 / 32)) {
      outerArc.push(C.destinationPoint(radius, angle))
      innerArc.push(C.destinationPoint(radius * 0.8, angle))
    }

    const teeth = []
    for (let i = 1; i < outerArc.length - 1; i++) {
      if (i % 5 === 0) {
        teeth.push([outerArc[i - 1], innerArc[i], outerArc[i + 1]])
      }
    }

    const anchor = outerArc[outerArc.length - 1]
    const bearing = outerArc[outerArc.length - 2].finalBearingTo(outerArc[outerArc.length - 1])
    const arrow = L.Shape.arrow(anchor, radius / 6, bearing)

    return [outerArc, ...teeth, arrow]
  },

  label ({ C, orientAngle, radius }) {
    const latlng = C.destinationPoint(radius, orientAngle + this.sizeAngle / 2)
    const bearing = wrap360(orientAngle + this.sizeAngle / 2)
    return { text: 'I', latlng, bearing }
  }
})

import L from 'leaflet'
import '../Corridor2Point'

// TACTICAL GRAPHICS / TASKS / CONTAIN
L.Feature['G*T*J-----'] = L.Corridor2Point.extend({

  path ({ A, B, width, finalBearing }) {
    const halfWidth = width / 2
    const tenthWidth = width / 10

    const outerArc = []
    const innerArc = []
    const orientAngle = finalBearing - 90
    const sizeAngle = 180

    for (let angle = orientAngle; angle <= orientAngle + sizeAngle; angle += (180 / 32)) {
      outerArc.push(B.destinationPoint(halfWidth, angle))
      innerArc.push(B.destinationPoint(halfWidth * 0.8, angle))
    }

    const spikes = []
    for (let i = 0; i < innerArc.length; i++) {
      if (i % 4 === 0) spikes.push([outerArc[i], innerArc[i]])
    }

    const arrow = L.Shape.arrow(B, tenthWidth, finalBearing)
    return [outerArc].concat(spikes, [[A, B], arrow])
  },

  labelCount: 2,

  label ({ A, A1, A2, B, initialBearing, finalBearing }) {
    return [
      {
        text: 'ENY',
        latlng: A.destinationPoint(A.distanceTo(B) / 2, initialBearing),
        bearing: A.initialBearingTo(B)
      },
      {
        text: 'C',
        latlng: B.destinationPoint(A1.distanceTo(A2) / 2, finalBearing),
        bearing: finalBearing
      }
    ]
  }
})

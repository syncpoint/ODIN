import L from 'leaflet'
import '../Corridor2Point'

L.Feature['G*T*C-----'] = L.Corridor2Point.extend({
  path ({ A, B, width, initialBearing, finalBearing }) {
    const halfWidth = width / 2
    const tenthWidth = width / 10

    const path = [[
      B.destinationPoint(halfWidth, finalBearing + 90),
      A.destinationPoint(halfWidth, initialBearing + 90),
      A.destinationPoint(halfWidth, initialBearing - 90),
      B.destinationPoint(halfWidth, finalBearing - 90)
    ]]

    // Arrows.
    path.push([
      path[0][3].destinationPoint(tenthWidth, finalBearing - 70),
      path[0][3].destinationPoint(tenthWidth, finalBearing + 110)
    ])

    path.push([
      path[0][0].destinationPoint(tenthWidth, finalBearing + 70),
      path[0][0].destinationPoint(tenthWidth, finalBearing - 110)
    ])

    return path
  },

  label ({ A, initialBearing }) {
    return { text: 'C', latlng: A, bearing: initialBearing }
  }
})

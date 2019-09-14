import L from 'leaflet'
import '../Corridor2Point'

L.Feature['G*T*Y-----'] = L.Corridor2Point.extend({
  path ({ A, B, width, initialBearing, finalBearing }) {
    const halfWidth = width / 2

    const path = [[
      B.destinationPoint(halfWidth, finalBearing + 90),
      A.destinationPoint(halfWidth, initialBearing + 90),
      A.destinationPoint(halfWidth, initialBearing - 90),
      B.destinationPoint(halfWidth, finalBearing - 90)
    ]]

    const tenthWidth = width / 10
    ;[0, 3].forEach(i => path.push(L.Shape.arrow(path[0][i], tenthWidth, finalBearing)))

    return path
  },

  label ({ A, initialBearing }) {
    return { text: 'B', latlng: A, bearing: initialBearing }
  }
})

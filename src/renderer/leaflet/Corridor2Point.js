import L from 'leaflet'
import './Shape'

const createGeometry = function (feature) {

  const create = (latlngs, width) => {
    const [A, B] = latlngs
    const geometry = { A, B }
    const initialBearing = A.initialBearingTo(B)
    const finalBearing = A.finalBearingTo(B)
    geometry.initialBearing = initialBearing
    geometry.finalBearing = finalBearing
    geometry.width = width

    // Keep feature geometry in sync:
    feature.properties.geometry_width = width
    feature.geometry.coordinates = [
      [geometry.A.lng, geometry.A.lat],
      [geometry.B.lng, geometry.B.lat]
    ]

    const halfWidth = width / 2
    geometry.A1 = A.destinationPoint(halfWidth, initialBearing + 90)
    geometry.A2 = A.destinationPoint(halfWidth, initialBearing - 90)
    geometry.B1 = B.destinationPoint(halfWidth, finalBearing + 90)
    geometry.B2 = B.destinationPoint(halfWidth, finalBearing - 90)

    const handlers = {
      A: latlng => create([latlng, latlngs[1]], width),
      B: latlng => create([latlngs[0], latlng], width),
      A1: latlng => create(latlngs, A.distance(latlng) * 2),
      A2: latlng => create(latlngs, A.distance(latlng) * 2),
      B1: latlng => create(latlngs, B.distance(latlng) * 2),
      B2: latlng => create(latlngs, B.distance(latlng) * 2)
    }

    geometry.points = fn => ['A', 'A1', 'A2', 'B', 'B1', 'B2'].forEach(id => fn(id, geometry[id]))
    geometry.update = (id, latlng) => {
      if (handlers[id]) return handlers[id](latlng)
      else return create(latlngs, width)
    }

    return geometry
  }

  const latlngs = feature.geometry.coordinates.map(([lon, lat]) => L.latLng(lat, lon))
  const width = feature.properties.geometry_width
  return { ...create(latlngs, width) }
}

L.Corridor2Point = L.Shape.extend({
  createGeometry,
  editorType: '2pt-corridor'
})

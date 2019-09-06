import L from 'leaflet'
import './Shape'

const createGeometry = function (feature) {

  const create = (latlngs, width) => {
    const geometry = { latlngs, width }

    // Keep feature geometry in sync:
    feature.properties.geometry_width = width
    feature.geometry.coordinates = latlngs.map(latlng => [latlng.lng, latlng.lat])

    const halfWidth = width / 2
    const A = latlngs[latlngs.length - 1]
    const bearing = latlngs[latlngs.length - 2].finalBearingTo(A)
    geometry.bearing = bearing
    geometry.A = A
    geometry.A1 = A.destinationPoint(halfWidth, bearing + 90)
    geometry.A2 = A.destinationPoint(halfWidth, bearing - 90)

    geometry.points = fn => ['A1', 'A2'].forEach(id => fn(id, geometry[id]))

    geometry.update = (latlngs) => {
      // TODO: validity check
      return create(latlngs, width)
    }

    geometry.updateWidth = (id, latlng) => {
      return create(latlngs, A.distance(latlng) * 2)
    }

    return geometry
  }

  const latlngs = feature.geometry.coordinates.map(([lon, lat]) => L.latLng(lat, lon))
  const width = feature.properties.geometry_width
  return { ...create(latlngs, width) }
}

L.CorridorNPoint = L.Shape.extend({
  createGeometry,
  editorType: 'npt-corridor'
})

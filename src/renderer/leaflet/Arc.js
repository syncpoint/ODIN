import L from 'leaflet'
import './Shape'

/**
 * Circle segment (arc) with fixed size angle and mnmRange = 0.
 */
const createGeometry = function (feature) {
  const create = (center, orientAngle, maxRange) => {
    const geometry = {}
    geometry.C = center
    geometry.O = center.destinationPoint(maxRange, orientAngle)
    geometry.S = center.destinationPoint(maxRange, orientAngle + this.sizeAngle)
    geometry.orientAngle = orientAngle
    geometry.radius = maxRange

    const handlers = {
      C: latlng => create(latlng, orientAngle, maxRange),
      O: latlng => create(
        center,
        center.finalBearingTo(latlng),
        center.distance(latlng)
      ),
      S: latlng => create(
        center,
        center.finalBearingTo(latlng) - this.sizeAngle,
        center.distance(latlng)
      )
    }

    geometry.points = fn => ['C', 'O', 'S'].forEach(id => fn(id, geometry[id]))
    geometry.update = (id, latlng) => {
      if (handlers[id]) return handlers[id](latlng)
      else return create(center, orientAngle, maxRange)
    }

    return geometry
  }

  const coordinates = feature.geometry.coordinates
  const center = L.latLng(coordinates[1], feature.geometry.coordinates[0])

  const orientAngle = feature.properties.geometry_orient_angle
  const maxRange = feature.properties.geometry_max_range
  return { ...create(center, orientAngle, maxRange) }
}

L.Arc = L.Shape.extend({
  createGeometry,
  editorType: 'arc'
})

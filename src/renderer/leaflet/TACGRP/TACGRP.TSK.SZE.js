import L from 'leaflet'
import '../Shape'

const createGeometry = function (feature) {

  const create = (center, orientAngle, rangeA, rangeB) => {
    const geometry = { orientAngle }
    geometry.C = center
    geometry.O = center.destinationPoint(rangeA, orientAngle)
    geometry.S = center.destinationPoint(rangeB, orientAngle + this.sizeAngle)

    const handlers = {
      C: latlng => create(latlng, orientAngle, rangeA, rangeB),
      O: latlng => create(center, center.finalBearingTo(latlng), Math.min(center.distance(latlng), rangeB), rangeB),
      S: latlng => create(center, orientAngle, rangeA, Math.max(center.distance(latlng), rangeA))
    }

    geometry.points = fn => ['C', 'O', 'S'].forEach(id => fn(id, geometry[id]))
    geometry.update = (id, latlng) => {
      if (handlers[id]) return handlers[id](latlng)
      else return create(center, orientAngle, rangeA, rangeB)
    }

    return geometry
  }

  const coordinates = feature.geometry.coordinates
  const center = L.latLng(coordinates[1], feature.geometry.coordinates[0])
  const orientAngle = feature.properties.geometry_orient_angle
  const mnmRange = feature.properties.geometry_mnm_range
  const maxRange = feature.properties.geometry_max_range
  return { ...create(center, orientAngle, mnmRange, maxRange) }
}

const path = function ({ C, O, S, orientAngle }) {
  const rangeA = C.distance(O)
  const rangeB = C.distance(S)
  const arc = []

  for (let angle = orientAngle; angle <= orientAngle + this.sizeAngle; angle += (180 / 32)) {
    arc.push(C.destinationPoint(rangeA, angle))
  }

  const radius = rangeB - rangeA
  const anchor = arc[arc.length - 1]
  const bearing = arc[arc.length - 2].finalBearingTo(arc[arc.length - 1])
  const arrow = L.Shape.arrow(anchor, radius / 4, bearing)

  const circleCenter = C
    .destinationPoint(rangeA, orientAngle)
    .destinationPoint(radius, orientAngle - 90)

  const circle = []
  for (let angle = 0; angle <= 360; angle += (180 / 32)) {
    circle.push(circleCenter.destinationPoint(radius, angle))
  }

  return [[...arc], [...circle], [...arrow]]
}

L.Feature['G*T*Z-----'] = L.Shape.extend({
  createGeometry,
  sizeAngle: 90,
  editorType: 'arc',
  path,
  labelCount: 0
})

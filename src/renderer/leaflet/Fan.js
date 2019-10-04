import L from 'leaflet'
import './Shape'

// FIXME: deprecated -> remove

/**
 * Fan with center point and two beams with different angles and lengths.
 */
const createGeometry = function (feature) {
  const create = (center, orientAngle, rangeA, sizeAngle, rangeB) => {
    const geometry = {}
    geometry.C = center
    geometry.A = center.destinationPoint(rangeA, orientAngle)
    geometry.B = center.destinationPoint(rangeB, orientAngle + sizeAngle)
    geometry.minRange = rangeA
    geometry.maxRange = rangeB

    const handlers = {
      C: latlng => create(latlng, orientAngle, rangeA, sizeAngle, rangeB),
      A: latlng => create(center, center.finalBearingTo(latlng), center.distance(latlng), sizeAngle, rangeB),
      B: latlng => create(
        center,
        orientAngle,
        rangeA,
        center.finalBearingTo(latlng) - orientAngle,
        center.distance(latlng)
      )
    }

    geometry.points = fn => ['C', 'A', 'B'].forEach(id => fn(id, geometry[id]))
    geometry.update = (id, latlng) => {
      if (handlers[id]) return handlers[id](latlng)
      else return create(center, orientAngle, rangeA, sizeAngle, rangeB)
    }

    return geometry
  }

  const coordinates = feature.geometry.coordinates
  const center = L.latLng(coordinates[1], feature.geometry.coordinates[0])
  const orientAngle = feature.properties.geometry_orient_angle
  const sizeAngle = feature.properties.geometry_size_angle
  const mnmRange = feature.properties.geometry_mnm_range
  const maxRange = feature.properties.geometry_max_range
  return { ...create(center, orientAngle, mnmRange, sizeAngle, maxRange) }
}

const path = function ({ C, A, B }) {
  const lengthA = C.distance(A)
  const initialBearingA = C.initialBearingTo(A)
  const finalBearingA = C.finalBearingTo(A)

  const lengthB = C.distance(B)
  const initialBearingB = C.initialBearingTo(B)
  const finalBearingB = C.finalBearingTo(B)

  const lines = []
  const delta = 5

  lines.push([ C, C.destinationPoint(lengthA * 0.7, initialBearingA - delta) ])
  lines.push([ A, A.destinationPoint(lengthA * -0.4, finalBearingA - delta) ])
  lines.push([lines[0][1], lines[1][1]])

  lines.push([ C, C.destinationPoint(lengthB * 0.7, initialBearingB + delta) ])
  lines.push([ B, B.destinationPoint(lengthB * -0.4, finalBearingB + delta) ])
  lines.push([lines[3][1], lines[4][1]])

  lines.push(L.Shape.arrow(A, lengthA / 10, finalBearingA))
  lines.push(L.Shape.arrow(B, lengthB / 10, finalBearingB))
  return lines
}

const label = function ({ C, A, B }) {
  const delta = 5
  const lengthA = C.distance(A)
  const initialBearingA = C.initialBearingTo(A)
  const lengthB = C.distance(B)
  const initialBearingB = C.initialBearingTo(B)

  return [{
    text: this.labelText,
    latlng: C.destinationPoint(lengthA * 0.3, initialBearingA - delta),
    bearing: initialBearingA
  }, {
    text: this.labelText,
    latlng: C.destinationPoint(lengthB * 0.3, initialBearingB + delta),
    bearing: initialBearingB
  }]
}

L.Fan = L.Shape.extend({
  createGeometry,
  editorType: 'fan',
  path,
  labelCount: 2,
  label
})

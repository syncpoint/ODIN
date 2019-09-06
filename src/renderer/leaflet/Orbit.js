import L from 'leaflet'
import './Shape'

/**
 * Circle segment (arc) with fixed size angle and mnmRange = 0.
 */
const createGeometry = function (feature) {
  const create = (latlngs, width, alignment) => {
    const [A, B] = latlngs
    const geometry = { A, B, width }
    geometry.initialBearing = A.initialBearingTo(B)
    geometry.finalBearing = A.finalBearingTo(B)
    geometry.offset = alignment === 'RIGHT' ? 90 : -90

    geometry.A1 = A.destinationPoint(width, geometry.initialBearing + geometry.offset)
    geometry.B1 = B.destinationPoint(width, geometry.finalBearing + geometry.offset)

    const handlers = {
      A: latlng => create([latlng, latlngs[1]], width, alignment),
      B: latlng => create([latlngs[0], latlng], width, alignment),
      // TODO: automatically change alignment
      A1: latlng => create(latlngs, A.distance(latlng), alignment),
      B1: latlng => create(latlngs, B.distance(latlng), alignment)
    }

    geometry.points = fn => ['A', 'B', 'A1', 'B1'].forEach(id => fn(id, geometry[id]))
    geometry.update = (id, latlng) => {
      if (handlers[id]) return handlers[id](latlng)
      else return create(latlngs, width, alignment)
    }

    return geometry
  }

  const coordinates = feature.geometry.coordinates
  const latlngs = coordinates.map(([lon, lat]) => L.latLng(lat, lon))
  const width = feature.properties.geometry_width
  const alignment = feature.properties.geometry_alignment
  return { ...create(latlngs, width, alignment) }
}

L.Orbit = L.Shape.extend({
  createGeometry,
  editorType: 'orbit'
})

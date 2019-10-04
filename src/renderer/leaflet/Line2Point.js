import L from 'leaflet'
import './Shape'

// FIXME: deprecated -> remove

const createGeometry = function (feature) {

  const create = latlngs => {
    const [A, B] = latlngs
    const geometry = { A, B }
    const initialBearing = A.initialBearingTo(B)
    const finalBearing = A.finalBearingTo(B)
    geometry.initialBearing = initialBearing
    geometry.finalBearing = finalBearing

    // Keep feature geometry in sync:
    feature.geometry.coordinates = [
      [geometry.A.lng, geometry.A.lat],
      [geometry.B.lng, geometry.B.lat]
    ]

    const handlers = {
      A: latlng => create([latlng, latlngs[1]]),
      B: latlng => create([latlngs[0], latlng])
    }

    geometry.points = fn => ['A', 'B'].forEach(id => fn(id, geometry[id]))
    geometry.update = (id, latlng) => {
      if (handlers[id]) return handlers[id](latlng)
      else return create(latlngs)
    }

    return geometry
  }

  const latlngs = feature.geometry.coordinates.map(([lon, lat]) => L.latLng(lat, lon))
  return { ...create(latlngs) }
}

L.Line2Point = L.Shape.extend({
  createGeometry,
  editorType: 'generic'
})

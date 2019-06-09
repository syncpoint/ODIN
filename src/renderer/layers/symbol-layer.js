import L from 'leaflet'
import evented from '../evented'
import store from '../stores/layer-store'

let map

const layer = ([name, features]) => new L.GeoJSON.Symbols({
  id: name,
  size: () => 34,
  features: () => features
}).addTo(map)

const bounds = json => {
  if (!json.bbox) return
  if (typeof json.bbox !== 'string') return

  const bounds = (lat1, lng1, lat2, lng2) => L.latLngBounds(L.latLng(lat1, lng1), L.latLng(lat2, lng2))

  // Format: PostGIS (ST_Extent())
  const regex = /BOX\((.*)[ ]+(.*)[, ]+(.*)[ ]+(.*)\)/
  const match = json.bbox.match(regex)
  if (match) {
    /* eslint-disable no-unused-vars */
    const [_, lng1, lat1, lng2, lat2] = match
    return bounds(lat1, lng1, lat2, lng2)
    /* eslint-enable no-unused-vars */
  }

  // Format: GeoJSON (simple array)
  const [lng1, lat1, lng2, lat2] = JSON.parse(json.bbox)
  return bounds(lat1, lng1, lat2, lng2)
}

const fitBounds = bounds => {
  if (!bounds) return
  map.fitBounds(bounds, { animate: true })
}


evented.on('MAP_CREATED', reference => {
  map = reference
  store.on('added', ({ name, file }) => {
    layer([name, file])
    fitBounds(bounds(file))
  })

  store.on('ready', state => Object.entries(state).forEach(layer))
})

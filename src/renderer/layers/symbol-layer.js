import L from 'leaflet'
import evented from '../evented'
import store from '../stores/layer-store'

let map

const layer = ([name, features]) => new L.GeoJSON.Symbols({
  id: name,
  size: () => 34,
  features: () => features
}).addTo(map)

evented.on('MAP_CREATED', reference => {
  map = reference
  store.on('added', ({ name, file }) => layer([name, file]))
  store.on('ready', state => Object.entries(state).forEach(layer))
})

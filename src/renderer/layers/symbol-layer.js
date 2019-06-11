import L from 'leaflet'
import Leaflet from '../leaflet'
import evented from '../evented'
import store from '../stores/layer-store'

let map
let group


const COLOR = {
  DARK: {
    P: '#e1dc00',
    U: '#e1dc00',
    F: '#006b8c',
    N: '#00a000',
    H: '#c80000',
    A: '#006b8c',
    S: '#c80000'
  },
  MEDIUM: {
    P: '#ffff00',
    U: '#ffff00',
    F: '#00a8dc',
    N: '#00e200',
    H: '#ff3031',
    A: '#00a8dc',
    S: '#ff3031'
  }
}

const color = id => COLOR.DARK[id] || '000000'

const bounds = ({ content }) => {
  if (!content.bbox) return
  if (typeof content.bbox !== 'string') return

  const bounds = (lat1, lng1, lat2, lng2) => L.latLngBounds(L.latLng(lat1, lng1), L.latLng(lat2, lng2))

  // Format: PostGIS (ST_Extent())
  const regex = /BOX\((.*)[ ]+(.*)[, ]+(.*)[ ]+(.*)\)/
  const match = content.bbox.match(regex)
  if (match) {
    /* eslint-disable no-unused-vars */
    const [_, lng1, lat1, lng2, lat2] = match
    return bounds(lat1, lng1, lat2, lng2)
    /* eslint-enable no-unused-vars */
  }

  // Format: GeoJSON (simple array)
  const [lng1, lat1, lng2, lat2] = JSON.parse(content.bbox)
  return bounds(lat1, lng1, lat2, lng2)
}

const fitBounds = bounds => {
  if (!bounds) return
  map.fitBounds(bounds, { animate: true })
}

const removeLayer = name => Leaflet.layers(group)
  .filter(layer => layer.options.id === name)
  .forEach(layer => layer.remove())

const addLayer = (name, layer) => new L.GeoJSON.Symbols(layer.content, {
  id: name,
  size: () => 34,
  filter: feature => feature.geometry,
  style: feature => {
    const { sidc } = feature.properties
    if (!sidc) return

    return {
      fillColor: 'none',
      color: color(sidc.charAt(1)),
      weight: 3,
      opacity: 1
    }
  }
}).addTo(group)

const addAllLayers = state => Object.entries(state)
  .filter(([_, layer]) => layer.show)
  .forEach(([name, layer]) => addLayer(name, layer))

evented.on('MAP_CREATED', reference => {
  map = reference
  group = L.layerGroup()
  group.addTo(map)

  store.on('added', ({ name, layer }) => {
    addLayer(name, layer)
    fitBounds(bounds(layer))
  })

  store.on('replaced', ({ name, layer }) => {
    removeLayer(name)
    addLayer(name, layer)
    fitBounds(bounds(layer))
  })

  store.on('removed', ({ name }) => removeLayer(name))
  store.on('hidden', ({ name }) => removeLayer(name))
  store.on('shown', ({ name, layer }) => addLayer(name, layer))

  if (store.ready()) addAllLayers(store.state())
  else store.on('ready', addAllLayers)
})

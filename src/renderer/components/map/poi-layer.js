import L from 'leaflet'
import ms from 'milsymbol'
import store from '../../stores/poi-store'
// import selection from '../App.selection'

const featureLayers = {}
let selected

const deselect = () => {
  if (!selected) return
  const layer = featureLayers[selected]
  layer.setIcon(layer.options.icons.standard)
  selected = undefined
}

const select = id => {
  deselect()
  selected = id
  const layer = featureLayers[selected]
  layer.setIcon(layer.options.icons.highlighted)
}

// feature: poi -> feature
const feature = poi => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [poi.lng, poi.lat] },
  properties: { poi, id: poi.id, sidc: 'GFGPGPRI----' }
})

// pointToLayer: feature -> latlng -> layer
const pointToLayer = (feature, latlng) => {
  const { id, sidc } = feature.properties
  const size = 40
  const symbol = options => new ms.Symbol(sidc, options)
  const icon = symbol => L.divIcon({
    className: '',
    html: symbol.asSVG(),
    iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y)
  })

  const options = { size, uniqueDesignation: id }
  const marker = L.marker(latlng, {
    id,
    icons: {
      standard: icon(symbol(options)),
      highlighted: icon(symbol({
        ...options,
        monoColor: 'white',
        outlineColor: 'grey',
        outlineWidth: 4
      }))
    },
    keyboard: false, // default: true
    draggable: true, // default: false
    autoPan: true,
    autoPanSpeed: 10 // default: 10
  })

  marker.on('moveend', ({ target }) => {
    const { id } = target.options
    const { lat, lng } = target.getLatLng()
    store.move(id, { lat, lng })
    if (selected !== id) select(id)
  })

  marker.on('click', event => {
    const { target } = event
    const { id } = target.options
    if (selected !== id) select(id)
  })

  marker.setIcon(marker.options.icons.standard)
  featureLayers[id] = marker
  return marker
}

const poiLayer = map => {
  map.on('click', () => deselect())
  map.on('keydown', event => {
    const { originalEvent } = event
    const remove = () => selected && store.remove(selected)

    if (originalEvent.key === 'Backspace' && originalEvent.metaKey) remove()
    else if (originalEvent.key === 'Delete') remove()
    else if (originalEvent.key === 'Escape') deselect()
  })

  const features = { type: 'FeatureCollection', features: [] }
  const layer = L.geoJSON(features, { pointToLayer })
  layer.id = 'POI_LAYER'
  layer.addTo(map)

  const add = poi => layer.addData(feature(poi))
  const remove = id => {
    if (featureLayers[id]) {
      deselect(id)
      layer.removeLayer(featureLayers[id])
      delete featureLayers[id]
    }
  }

  store.on('added', add)
  store.on('removed', remove)

  store.once('ready', model => Object.entries(model)
    .map(([id, poi]) => ({ id, ...poi }))
    .forEach(add)
  )
}

export default poiLayer

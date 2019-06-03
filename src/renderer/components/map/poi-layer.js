import L from 'leaflet'
import ms from 'milsymbol'
import uuid from 'uuid-random'
import store from '../../stores/poi-store'
import evented from '../../evented'
import selection from '../App.selection'

// uuid -> marker/layer
const featureLayers = {}

const selected = () => {
  if (!selection.selected()) return
  const { type, uuid } = selection.selected()
  if (type === 'poi') return uuid
}

const deselect = () => selection.deselect()

const select = uuid => {
  if (selected() !== uuid) {
    const layer = featureLayers[uuid]
    const { actions } = layer.feature
    selection.select({
      type: 'poi',
      uuid,
      ...actions
    })
  }
}

selection.on('selected', object => {
  const { type, uuid } = object
  if (type !== 'poi') return
  const layer = featureLayers[uuid]
  layer.setIcon(layer.options.icons.highlighted)
})

selection.on('deselected', object => {
  const { type, uuid } = object
  if (type !== 'poi') return
  const layer = featureLayers[uuid]
  layer.setIcon(layer.options.icons.standard)
})

// feature: poi -> actions -> feature
const feature = (poi, actions) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [poi.lng, poi.lat] },
  properties: { name: poi.name, uuid: poi.uuid, sidc: 'GFGPGPRI----' },
  actions
})

// ==> marker symbol and icons

const symbol = (sidc, options) => new ms.Symbol(sidc, options)

const icon = symbol => L.divIcon({
  className: '',
  html: symbol.asSVG(),
  iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y)
})

const standardIcon = (sidc, options) => icon(symbol(sidc, options))

const highlightedIcon = (sidc, options) => icon(symbol(sidc, {
  ...options,
  monoColor: 'white',
  outlineColor: 'grey',
  outlineWidth: 4
}))

// <== marker symbol and icons

// ==> marker mouse handlers

const moveend = ({ target }) => {
  const { uuid } = target.options
  const { lat, lng } = target.getLatLng()
  store.move(uuid, { lat, lng })
  select(uuid)
}

const click = ({ target }) => {
  const { uuid } = target.options
  select(uuid)
}

// <== marker mouse handlers

// pointToLayer: feature -> latlng -> layer
const pointToLayer = (feature, latlng) => {
  const { uuid, name, sidc } = feature.properties

  const options = { size: 34, uniqueDesignation: name }
  const marker = L.marker(latlng, {
    uuid,
    icons: {
      standard: standardIcon(sidc, options),
      highlighted: highlightedIcon(sidc, options)
    },
    keyboard: false, // default: true
    draggable: true, // default: false
    autoPan: true,
    autoPanSpeed: 10 // default: 10
  })

  marker.on('moveend', moveend)
  marker.on('click', click)

  // Set icon depending on current selection:
  const icons = marker.options.icons
  marker.setIcon(selected() === uuid ? icons.highlighted : icons.standard)
  featureLayers[uuid] = marker
  return marker
}

const poiLayer = map => {

  // Add empty layer to map:
  const features = { type: 'FeatureCollection', features: [] }
  const layer = L.geoJSON(features, { pointToLayer })
  layer.id = 'POI_LAYER'
  layer.addTo(map)

  const remove = ({ uuid }) => {
    if (uuid && featureLayers[uuid]) {
      deselect()
      layer.removeLayer(featureLayers[uuid])
      delete featureLayers[uuid]
      store.remove(uuid)
    }
  }

  const add = poi => {
    const { uuid, ...properties } = poi
    layer.addData(feature(poi, {
      delete: () => remove({ uuid }),
      copy: () => ({ type: 'poi', ...properties }),
      cut: () => { store.remove(uuid); return { type: 'poi', ...properties } }
    }))
  }

  const rename = ({ uuid }) => {
    layer.removeLayer(featureLayers[uuid])
    delete featureLayers[uuid]
    add({ uuid, ...store.state()[uuid] })
  }

  store.on('added', add)
  store.on('removed', remove)
  store.on('renamed', rename)
  store.once('ready', state => Object.entries(state)
    .map(([uuid, poi]) => ({ uuid, ...poi }))
    .forEach(add)
  )

  evented.on('CLIPBOARD_PASTE', (type, poi) => {
    if (type !== 'poi') return
    store.add(uuid(), poi)
  })
}

export default poiLayer

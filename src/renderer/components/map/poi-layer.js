import L from 'leaflet'
import ms from 'milsymbol'
import uuid from 'uuid-random'
import store from '../../stores/poi-store'
import selection from '../App.selection'
import clipboard from '../App.clipboard'

// uuid -> marker/layer
const featureLayers = {}

const selected = () => {
  if (!selection.selected()) return
  const { type, uuid } = selection.selected()
  if (type === 'poi') return uuid
}

const deselect = () => selection.deselect()

const select = uuid => selected() !== uuid
  ? selection.select({ type: 'poi', uuid })
  : () => {}

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

// feature: poi -> feature
const feature = poi => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [poi.lng, poi.lat] },
  properties: { name: poi.name, uuid: poi.uuid, sidc: 'GFGPGPRI----' }
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

const layerOps = layer => {
  const add = poi => layer.addData(feature(poi))

  const remove = ({ uuid }) => {
    if (uuid && featureLayers[uuid]) {
      deselect()
      layer.removeLayer(featureLayers[uuid])
      delete featureLayers[uuid]
      store.remove(uuid) // FIXME: cyclic call when triggered from store event 'removed':
    }
  }

  const rename = ({ uuid }) => {
    layer.removeLayer(featureLayers[uuid])
    delete featureLayers[uuid]
    add({ uuid, ...store.state()[uuid] })
  }

  return {
    add,
    remove,
    rename
  }
}

const clipboardHandlers = {
  copy: () => {
    const selected = selection.selected()
    if (!selected) return
    const poi = store.state()[selected.uuid]
    return JSON.stringify(poi)
  },

  cut: () => {
    const selected = selection.selected()
    if (selected) {
      const poi = store.state()[selected.uuid]
      store.remove(selected.uuid)
      return JSON.stringify(poi)
    }
  },

  paste: text => {
    // TODO: Check if clipboard content is of expected type.
    // TODO: Disambiguate name.
    const poi = JSON.parse(text)
    store.add(uuid(), poi)
  }
}

const poiLayer = map => {

  // Add empty layer to map:
  const features = { type: 'FeatureCollection', features: [] }
  const layer = L.geoJSON(features, { pointToLayer })
  layer.id = 'POI_LAYER'
  layer.addTo(map)

  const markers = layerOps(layer)

  map.on('click', () => deselect())
  map.on('keydown', event => {
    const { originalEvent } = event
    const removeSelected = () => markers.remove({ uuid: selected() })
    if (originalEvent.key === 'Backspace' && originalEvent.metaKey) removeSelected()
    else if (originalEvent.key === 'Delete') removeSelected()
    else if (originalEvent.key === 'Escape') deselect()
  })

  store.on('added', markers.add)
  store.on('removed', markers.remove)
  store.on('renamed', markers.rename)
  store.once('ready', state => Object.entries(state)
    .map(([uuid, poi]) => ({ uuid, ...poi }))
    .forEach(markers.add)
  )

  clipboard.registerHandler(clipboardHandlers)
}

export default poiLayer

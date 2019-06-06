import L from 'leaflet'
import ms from 'milsymbol'
import uuid from 'uuid-random'
import { ipcRenderer } from 'electron'
import store from '../../stores/poi-store'
import selection from '../App.selection'
import mouseInput from './mouse-input'

// uuid -> marker/layer
const featureLayers = {}

// Set if newly added POI should automatically be selected:
let pendingSelect

const select = uuid => {
  const [selected] = selection.selected('poi')
  if (selected && selected.uuid === uuid) return
  const layer = featureLayers[uuid]
  if (!layer) return

  const { actions } = layer.feature
  selection.select({
    type: 'poi',
    uuid,
    ...actions
  })
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
  outlineColor: 'black',
  outlineWidth: 6
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

  const options = { size: 34 }
  if (name) options.uniqueDesignation = name
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
  marker.setIcon(icons.standard)
  selection.selected('poi')
    .filter(selected => selected.uuid === uuid)
    .forEach(_ => marker.setIcon(icons.highlighted))

  featureLayers[uuid] = marker

  // Note: At this point `feature` property is not already attached to marker.
  return marker
}

const onEachFeature = (feature, _) => {
  if (!pendingSelect) return
  if (feature.properties.uuid !== pendingSelect) return
  select(pendingSelect)
  pendingSelect = null
}

const poiLayer = map => {

  // Add empty layer to map:
  const features = { type: 'FeatureCollection', features: [] }
  const layer = L.geoJSON(features, { pointToLayer, onEachFeature })
  layer.id = 'POI_LAYER'
  layer.addTo(map)

  const remove = ({ uuid }) => {
    if (uuid && featureLayers[uuid]) {
      selection.deselect()
      layer.removeLayer(featureLayers[uuid])
      delete featureLayers[uuid]
      store.remove(uuid)
    }
  }

  const add = poi => {
    layer.addData(feature(poi, {
      delete: () => remove({ uuid: poi.uuid }),
      properties: () => ({ ...store.state()[poi.uuid] }),
      paste: properties => {
        pendingSelect = uuid()
        store.add(pendingSelect, properties)
      }
    }))
  }

  const rename = ({ uuid }) => {
    layer.removeLayer(featureLayers[uuid])
    delete featureLayers[uuid]
    add({ uuid, ...store.state()[uuid] })
  }

  const move = ({ uuid, lat, lng }) => {
    const layer = featureLayers[uuid]
    if (!layer) return
    const latlng = layer.getLatLng()
    if (latlng.lat === lat && latlng.lng === lng) return
    layer.setLatLng(L.latLng(lat, lng))
  }

  store.on('added', add)
  store.on('removed', remove)
  store.on('renamed', rename)
  store.on('moved', move)
  store.once('ready', state => Object.entries(state)
    .map(([uuid, poi]) => ({ uuid, ...poi }))
    .forEach(add)
  )

  ipcRenderer.on('COMMAND_NEW_POI', () => {
    mouseInput.pickPoint({
      prompt: 'Pick a location...',
      picked: latlng => {
        pendingSelect = uuid()
        store.add(pendingSelect, { ...latlng })
      }
    })
  })
}

export default poiLayer

import L from 'leaflet'
import ms from 'milsymbol'
import uuid from 'uuid-random'
import store from '../../stores/poi-store'
import selection from '../App.selection'
import clipboard from '../App.clipboard'

const featureLayers = {}
let selected

const deselect = () => {
  if (!selected) return
  const layer = featureLayers[selected]
  layer.setIcon(layer.options.icons.standard)
  selected = undefined
  selection.deselect()
}

const select = uuid => {
  deselect()
  selected = uuid
  const layer = featureLayers[selected]
  layer.setIcon(layer.options.icons.highlighted)
  selection.select({ type: 'poi', uuid })
}

// feature: poi -> feature
const feature = poi => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [poi.lng, poi.lat] },
  properties: { name: poi.name, uuid: poi.uuid, sidc: 'GFGPGPRI----' }
})

// pointToLayer: feature -> latlng -> layer
const pointToLayer = (feature, latlng) => {
  const { uuid, name, sidc } = feature.properties
  const size = 34
  const symbol = options => new ms.Symbol(sidc, options)
  const icon = symbol => L.divIcon({
    className: '',
    html: symbol.asSVG(),
    iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y)
  })

  const options = { size, uniqueDesignation: name }
  const marker = L.marker(latlng, {
    uuid,
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
    const { uuid } = target.options
    const { lat, lng } = target.getLatLng()
    store.move(uuid, { lat, lng })
    select(uuid)
  })

  marker.on('click', event => {
    const { target } = event
    const { uuid } = target.options
    if (selected !== uuid) select(uuid)
  })

  const icons = marker.options.icons
  marker.setIcon(selected === uuid ? icons.highlighted : icons.standard)
  featureLayers[uuid] = marker
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

  const add = poi => {
    layer.addData(feature(poi))
  }

  const remove = ({ uuid }) => {
    if (featureLayers[uuid]) {
      deselect()
      layer.removeLayer(featureLayers[uuid])
      delete featureLayers[uuid]
    }
  }

  const renamed = ({ uuid }) => {
    layer.removeLayer(featureLayers[uuid])
    delete featureLayers[uuid]
    add({ uuid, ...store.state()[uuid] })
  }

  store.on('added', add)
  store.on('removed', remove)
  store.on('renamed', renamed)

  store.once('ready', model => Object.entries(model)
    .map(([uuid, poi]) => ({ uuid, ...poi }))
    .forEach(add)
  )

  clipboard.registerHandler({
    copy: () => {
      const selected = selection.selected()
      if (!selected) return
      const poi = store.state()[selected.uuid]

      // TODO: needs type or other identification
      return JSON.stringify(poi)
    },

    cut: () => {
      const selected = selection.selected()
      if (selected) {
        const poi = store.state()[selected.uuid]
        store.remove(selected.uuid)

        // TODO: needs type or other identification
        return JSON.stringify(poi)
      }
    },

    paste: text => {
      // TODO: Check if clipboard content is of expected type.
      // TODO: Disambiguate name.
      const poi = JSON.parse(text)
      store.add(uuid(), poi)
    }
  })
}

export default poiLayer

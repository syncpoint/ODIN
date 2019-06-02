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
    select(uuid)
  })

  const icons = marker.options.icons
  marker.setIcon(selected() === uuid ? icons.highlighted : icons.standard)
  featureLayers[uuid] = marker
  return marker
}

const poiLayer = map => {

  const add = poi => {
    layer.addData(feature(poi))
  }

  const remove = ({ uuid }) => {
    if (uuid && featureLayers[uuid]) {
      deselect()
      layer.removeLayer(featureLayers[uuid])
      delete featureLayers[uuid]

      // FIXME: cyclic call when triggered from store event 'removed':
      store.remove(uuid)
    }
  }

  const removeSelected = () => remove({ uuid: selected() })

  const renamed = ({ uuid }) => {
    layer.removeLayer(featureLayers[uuid])
    delete featureLayers[uuid]
    add({ uuid, ...store.state()[uuid] })
  }


  map.on('click', () => deselect())
  map.on('keydown', event => {
    const { originalEvent } = event
    if (originalEvent.key === 'Backspace' && originalEvent.metaKey) removeSelected()
    else if (originalEvent.key === 'Delete') removeSelected()
    else if (originalEvent.key === 'Escape') deselect()
  })

  const features = { type: 'FeatureCollection', features: [] }
  const layer = L.geoJSON(features, { pointToLayer })
  layer.id = 'POI_LAYER'
  layer.addTo(map)


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
  })
}

export default poiLayer

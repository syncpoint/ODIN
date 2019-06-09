import L from 'leaflet'
import uuid from 'uuid-random'
import evented from '../evented'
import poiStore from '../stores/poi-store'

const feature = (id, properties) => ({
  type: 'Feature',
  id: id,
  geometry: { type: 'Point', coordinates: [properties.lng, properties.lat] },
  properties: { t: properties.name, sidc: 'GFGPGPRI----' },
  actions: {
    move: latlng => poiStore.move(id, latlng),
    properties: () => poiStore.state()[id],
    paste: properties => poiStore.add(uuid(), properties),
    delete: () => poiStore.remove(id)
  }
})

evented.on('MAP_CREATED', map => {
  const symbols = new L.GeoJSON.Symbols({
    id: 'poi-layer',
    size: () => 34,
    draggable: true,
    selectable: true // default: false
  })
  symbols.addTo(map)

  poiStore.on('added', ({ uuid, ...properties }) => symbols.addFeature(feature(uuid, properties)))
  poiStore.on('removed', ({ uuid }) => symbols.removeFeature(uuid))
  poiStore.on('moved', ({ uuid, lat, lng }) => symbols.moveFeature(uuid, lat, lng))
  poiStore.on('renamed', ({ uuid, ...properties }) => symbols.replaceFeature(uuid, feature(uuid, properties)))

  poiStore.on('ready', state => {
    const features = Object.entries(state).map(([id, properties]) => feature(id, properties))
    symbols.addData(features)
  })
})

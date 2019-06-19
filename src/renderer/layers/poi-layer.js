import React from 'react'
import POIProperties from '../components/POIProperties'
import L from 'leaflet'
import uuid from 'uuid-random'
import evented from '../evented'
import store from '../stores/poi-store'

const polygon = properties => ({
  type: 'Polygon',
  coordinates: properties.latlngs.map(ring => ring.map(({ lat, lng }) => ([lng, lat])))
})

const point = properties => ({
  type: 'Point',
  coordinates: [properties.lng, properties.lat]
})

const geometry = properties => properties.latlngs
  ? polygon(properties)
  : point(properties)

const feature = (id, properties) => {

  // Provide different update method depending on geometry
  const update = properties.latlngs
    ? store.update(id)
    : store.move(id)

  return {
    type: 'Feature',
    id: id,
    geometry: geometry(properties),
    properties: { t: properties.name, sidc: 'GFGPGPRI----' },
    actions: {
      update,
      properties: () => store.state()[id],
      paste: properties => store.add(uuid(), properties),
      delete: () => store.remove(id),
      edit: () => <POIProperties uuid={ id } />
    }
  }
}

evented.on('MAP_CREATED', map => {
  const symbols = new L.GeoJSON.Symbols(null, {
    id: 'poi-layer',
    size: () => 34,
    draggable: true,
    selectable: true, // default: false
    style: {
      fillColor: 'none',
      color: 'black',
      weight: 3,
      opacity: 1
    }
  })
  symbols.addTo(map)

  store.on('added', ({ uuid, ...properties }) => symbols.addFeature(feature(uuid, properties)))
  store.on('removed', ({ uuid }) => symbols.removeFeature(uuid))
  store.on('moved', ({ uuid, lat, lng }) => symbols.moveFeature(uuid, lat, lng))
  store.on('renamed', ({ uuid, ...properties }) => symbols.replaceFeature(uuid, feature(uuid, properties)))

  store.on('ready', state => {
    const features = Object.entries(state).map(([id, properties]) => feature(id, properties))
    symbols.addData(features)
  })
})

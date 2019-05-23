import React from 'react'
import ListItemText from '@material-ui/core/ListItemText'
import L from 'leaflet'
import nominatim from './nominatim'
import mapSettings from './map/settings'

const searchOptions = {
  limit: 15, // default: 10, maximum: 50
  addressdetails: 1,
  namedetails: 0,
  dedupe: 1
}

const places = options => term => nominatim(searchOptions)(term).then(rows => {
  const { context, center } = options
  const { lat, lng } = center

  const distance = x => Math.sqrt(
    Math.pow((lat - Number.parseFloat(x.lat)), 2) +
    Math.pow((lng - Number.parseFloat(x.lon)), 2)
  )

  return rows
    .sort((a, b) => distance(a) - distance(b))
    .map(row => ({
      key: row.place_id, // mandatory
      text: <ListItemText primary={ row.display_name } secondary={ 'Place' }/>,
      action: () => {
        context.setCenter(L.latLng(row.lat, row.lon))
        if (row.poi) {
          const pois = mapSettings.get('pois') || {}
          pois[row.poi] = { lat: row.lat, lng: row.lon }
          mapSettings.set('pois', pois)
        }
      }
    }))
})

const bookmarks = options => term => {
  const { context } = options
  const items = Object.entries((mapSettings.get('bookmarks') || {}))
    .filter(([id, _]) => id.search(new RegExp(term, 'i')) !== -1)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, bookmark]) => ({
      key: id,
      text: <ListItemText primary={ id } secondary={ 'Bookmark' }/>,
      action: () => context.setViewPort(L.latLng(bookmark.lat, bookmark.lng), bookmark.zoom),
      delete: () => {
        const bookmarks = mapSettings.get('bookmarks')
        delete bookmarks[id]
        mapSettings.set('bookmarks', bookmarks)
      }
    }))

  return Promise.resolve(items)
}

const pois = options => term => {
  const { context } = options
  const items = Object.entries((mapSettings.get('pois') || {}))
    .filter(([id, _]) => id.search(new RegExp(term, 'i')) !== -1)
    .map(([id, poi]) => ({
      key: id,
      text: <ListItemText primary={ id } secondary={ 'POI' }/>,
      action: () => context.setCenter(L.latLng(poi.lat, poi.lng)),
      delete: () => {
        const pois = mapSettings.get('pois')
        delete pois[id]
        mapSettings.set('pois', pois)
      }
    }))

  return Promise.resolve(items)
}

// Available providers (order matter):
const itemProviders = [
  pois,
  bookmarks,
  places
]

const items = options => term => Promise
  .all(itemProviders.map(fn => fn(options)(term)))
  .then(xs => xs.reduce((acc, x) => acc.concat(x), []))


const spotlightOptions = options => {
  return {
    items: items(options),
    placeholder: 'Spotlight Search'
  }
}

export default spotlightOptions

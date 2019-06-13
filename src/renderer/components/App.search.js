import React from 'react'
import { ListItemText } from '@material-ui/core'
import L from 'leaflet'
import EventEmitter from 'events'
import uuid from 'uuid-random'
import poiStore from '../stores/poi-store'
import layerStore from '../stores/layer-store'
import LayerListItem from '../components/spotlight/LayerListItem'
import evented from '../evented'
import nominatim from '../model/nominatim'
import settings from '../model/settings'

const items = new EventEmitter()

// maintain ordered list of contributions.
const contributions = []
const contributors = []

let searchTerm
items.updateFilter = term => {
  searchTerm = term
  contributors.forEach(c => c.updateFilter())
}

items.snapshot = () => contributions.reduce((acc, val) => acc.concat(val), [])

const register = contributor => {
  const slot = contributors.length
  contributors.push(contributor)
  contributor.on('updated', contribution => {
    contributions[slot] = contribution
    items.emit('updated', contributions.reduce((acc, val) => acc.concat(val), []))
  })

  return () => searchTerm
}

// Symbol layers:
;(() => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  const contribution = () => {
    const filter = term()
      ? ([name, _]) => name.search(new RegExp(term(), 'i')) !== -1
      : () => true

    const handleChange = name => checked => {
      if (!name && checked === undefined) {
        Object.values(layerStore.state()).some(features => features.show)
          ? layerStore.hideAll()
          : layerStore.showAll()
      } else {
        setImmediate(() => {
          (checked ? layerStore.show : layerStore.hide)(name)
        })
      }
    }

    const items = Object.entries(layerStore.state())
      .filter(filter)
      .map(([name, features]) => ({
        name,
        tags: ['Layer', ...name.split(':').splice(1)],
        checked: features.show,
        onChange: handleChange(name)
      })).map(props => ({
        key: `layer://${props.name}`,
        text: <LayerListItem { ...props }/>,
        action: () => handleChange(props.name)(!props.checked),
        delete: () => layerStore.remove(props.name)
      }))

    // Add 'master switch':
    if (items.length) {
      const showSome = Object.values(layerStore.state()).some(fatures => fatures.show)
      const props = {
        name: 'All Layers',
        tags: ['Layer'],
        checked: showSome,
        // FIXME: flips right back: showSome is probably at fault.
        onChange: handleChange()
      }
      items.unshift({
        key: `layer://`,
        text: <LayerListItem { ...props }/>,
        action: handleChange(),
        delete: () => layerStore.removeAll()
      })
    }

    return items
  }

  if (layerStore.ready()) contributor.emit('updated', contribution())
  else layerStore.once('ready', () => contributor.emit('updated', contribution()))

  layerStore.on('shown', () => contributor.emit('updated', contribution()))
  layerStore.on('hidden', () => contributor.emit('updated', contribution()))
  layerStore.on('added', () => contributor.emit('updated', contribution()))
  layerStore.on('removed', () => contributor.emit('updated', contribution()))
  contributor.updateFilter = () => contributor.emit('updated', contribution())
})()

// Point of interest:
;(() => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  const contribution = () => {
    const filter = term()
      ? ([_, poi]) => poi.name && poi.name.search(new RegExp(term(), 'i')) !== -1
      : () => true

    return Object.entries(poiStore.state())
      .filter(filter)
      .map(([uuid, poi]) => ({
        key: uuid,
        text: <ListItemText primary={ poi.name } secondary={ 'POI' }/>,
        action: () => evented.emit('map.center', L.latLng(poi.lat, poi.lng)),
        delete: () => poiStore.remove(uuid)
      }))
  }

  if (poiStore.ready()) contributor.emit('updated', contribution())
  else poiStore.once('ready', () => contributor.emit('updated', contribution()))
  poiStore.on('removed', () => contributor.emit('updated', contribution()))
  contributor.updateFilter = () => contributor.emit('updated', contribution())
})()

// Nominatim:

let map
evented.once('MAP_CREATED', reference => (map = reference))

;(() => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  const searchOptions = {
    limit: 15, // default: 10, maximun: 50
    addressdetails: 1,
    namedetails: 0,
    dedupe: 1
  }

  contributor.updateFilter = () => {
    const { lat, lng } = map.getCenter()

    nominatim(searchOptions)(term()).then(rows => {

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
            evented.emit('map.center', L.latLng(row.lat, row.lon))

            // If it is a result of a reverse search (i.e. POI), store it for later use.
            if (row.poi) poiStore.add(uuid(), { name: row.poi, lat: row.lat, lng: row.lon })
          }
        }))
    }).then(items => contributor.emit('updated', items))
  }
})()

// Bookmarks:
;(() => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  contributor.updateFilter = () => {
    const items = Object.entries((settings.bookmarks.get()))
      .filter(([id, _]) => id.search(new RegExp(term(), 'i')) !== -1)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([id, bookmark]) => ({
        key: id,
        text: <ListItemText primary={ id } secondary={ 'Bookmark' }/>,
        action: () => evented.emit('map.viewport', L.latLng(bookmark.lat, bookmark.lng), bookmark.zoom),
        delete: () => {
          const bookmarks = settings.bookmarks.get()
          delete bookmarks[id]
          settings.bookmarks.set(bookmarks)
        }
      }))

    contributor.emit('updated', items)
  }
})()

export default items

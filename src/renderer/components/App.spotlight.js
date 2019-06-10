import React from 'react'
import { ListItemText, ListItemSecondaryAction, Switch } from '@material-ui/core'
import L from 'leaflet'
import uuid from 'uuid-random'
import nominatim from './nominatim'
import settings from './map/settings'
import poiStore from '../stores/poi-store'
import layerStore from '../stores/layer-store'

const searchOptions = {
  limit: 15, // default: 10, maximun: 50
  addressdetails: 1,
  namedetails: 0,
  dedupe: 1
}

const places = options => term => nominatim(searchOptions)(term).then(rows => {
  const { context, center } = options
  const { lat, lng } = center()

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

        // If it is a result of a reverse search (i.e. POI), store it for later use.
        if (row.poi) poiStore.add(uuid(), { name: row.poi, lat: row.lat, lng: row.lon })
      }
    }))
})

const bookmarks = options => term => {
  const { context } = options
  const items = Object.entries((settings.bookmarks.get()))
    .filter(([id, _]) => id.search(new RegExp(term, 'i')) !== -1)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, bookmark]) => ({
      key: id,
      text: <ListItemText primary={ id } secondary={ 'Bookmark' }/>,
      action: () => context.setViewPort(L.latLng(bookmark.lat, bookmark.lng), bookmark.zoom),
      delete: () => {
        const bookmarks = settings.bookmarks.get()
        delete bookmarks[id]
        settings.bookmarks.set(bookmarks)
      }
    }))

  return Promise.resolve(items)
}

const pois = options => term => {
  const { context } = options
  const items = Object.entries(poiStore.state())
    .filter(([_, poi]) => poi.name && poi.name.search(new RegExp(term, 'i')) !== -1)
    .map(([uuid, poi]) => ({
      key: uuid,
      text: <ListItemText primary={ poi.name } secondary={ 'POI' }/>,
      action: () => context.setCenter(L.latLng(poi.lat, poi.lng)),
      delete: () => poiStore.remove(uuid)
    }))

  return Promise.resolve(items)
}

const layers = options => term => {

  const handleToggle = name => () => {
    if (!name) {
      const state = layerStore.state()
      const show = Object.values(state)[0].show
      if (show) layerStore.hideAll()
      else layerStore.showAll()
    } else {
      const show = layerStore.state()[name].show
      if (show) layerStore.hide(name)
      else layerStore.show(name)
    }
  }

  const items = Object.entries(layerStore.state())
    .filter(([name, _]) => name.search(new RegExp(term, 'i')) !== -1)
    .map(([name, features]) => {
      const tags = name.split(':').splice(1)
      tags.unshift('Layer')

      return {
        key: `layer://${name}`,
        text: (
          <div>
            <ListItemText primary={ name } secondary={ tags.join(' ') }/>
            <ListItemSecondaryAction>
              <Switch edge="end"/>
            </ListItemSecondaryAction>
          </div>
        ),
        action: handleToggle(name),
        delete: () => layerStore.remove(name)
      }
    })

  // Add 'master switch':
  if (items.length) {
    items.unshift({
      key: `layer://`,
      text: (
        <div>
          <ListItemText primary={ 'All Layers' } secondary={ 'Layer' }/>
          <ListItemSecondaryAction>
            <Switch edge="end"/>
          </ListItemSecondaryAction>
        </div>
      ),
      action: handleToggle(),
      delete: () => layerStore.removeAll()
    })
  }

  return Promise.resolve(items)
}

// Available providers (order matter):
const itemProviders = [
  layers,
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
    placeholder: 'Spotlight Search',
    close: options.close
  }
}

export default spotlightOptions

import EventEmitter from 'events'
import React from 'react'
import { ListItemText } from '@material-ui/core'
import L from 'leaflet'
import evented from '../evented'
import settings from './settings'

export default register => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  contributor.updateFilter = () => {

    const contribution = () => Object.entries((settings.bookmarks.get()))
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
          contributor.emit('updated', contribution())
        }
      }))

    contributor.emit('updated', contribution())
  }
}

import React from 'react'
import { ListItemText } from '@material-ui/core'
import L from 'leaflet'
import settings from './settings'

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

export default bookmarks

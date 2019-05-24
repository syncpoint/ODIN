import mapSettings from './map/settings'
import evented from '../evented'

const addBookmarkOptions = options => {
  const { center, zoom } = options

  const accept = value => {
    const bookmarks = mapSettings.get('bookmarks') || {}
    bookmarks[value] = { zoom: zoom(), lat: center().lat, lng: center().lng }
    mapSettings.set('bookmarks', bookmarks)
    evented.emit('OSD_MESSAGE', { message: 'Bookmark saved', duration: 1500 })
  }

  return {
    accept,
    placeholder: 'Bookmark Name'
  }
}

export default addBookmarkOptions

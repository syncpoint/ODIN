import settings from './map/settings'
import evented from '../evented'

const addBookmarkOptions = options => {
  const { center, zoom } = options

  const accept = value => {
    const bookmarks = settings.bookmarks.get()
    bookmarks[value] = { zoom: zoom(), lat: center().lat, lng: center().lng }
    settings.bookmarks.set(bookmarks)
    evented.emit('OSD_MESSAGE', { message: 'Bookmark saved', duration: 1500 })
  }

  return {
    accept,
    placeholder: 'Bookmark Name'
  }
}

export default addBookmarkOptions

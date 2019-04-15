/**
 * Facade for reading and writing user settings.
 * Event though the currently underlying lib does syncronous I/O,
 * we design the interface to be asynchronous, using promises.
 */
const settings = require('electron-settings')

const DISPLAY_FILTER = 'displayFilter'
const MAP_VIEWPORT = 'mapViewport'
const TILE_PROVIDER = 'tileProvider'

const properties = id => ({
  read: () => Promise.resolve(settings.get(id)),
  write: values => settings.set(id, values)
})

module.exports = {
  DISPLAY_FILTER,
  MAP_VIEWPORT,
  TILE_PROVIDER,
  properties
}

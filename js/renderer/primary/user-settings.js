/* gateway to main process' user settings store. */

const { ipcRenderer } = require('electron')

const writeDisplayFilter = values => {
  ipcRenderer.send('SETTINGS_DISPLAY_FILTER_WRITE', values)
}

const readDisplayFilter = defaultValues => new Promise(resolve => {
  ipcRenderer.once('SETTINGS_DISPLAY_FILTER', (_, values) => resolve(values || defaultValues))
  ipcRenderer.send('SETTINGS_DISPLAY_FILTER_READ')
})

const writeMapViewport = viewport => {
  ipcRenderer.send('SETTINGS_MAP_VIEWPORT_WRITE', viewport)
}

const readMapViewport = () => new Promise(resolve => {
  ipcRenderer.once('SETTINGS_MAP_VIEWPORT', (_, viewport) => resolve(viewport))
  ipcRenderer.send('SETTINGS_MAP_VIEWPORT_READ')
})

module.exports = {
  displayFilter: {
    read: readDisplayFilter,
    write: writeDisplayFilter
  },

  mapViewport: {
    read: readMapViewport,
    write: writeMapViewport
  }
}

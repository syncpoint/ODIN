const { ipcMain } = require('electron')
const settings = require('electron-settings')

ipcMain.on('SETTINGS_DISPLAY_FILTER_READ', event => {
  event.sender.send('SETTINGS_DISPLAY_FILTER', settings.get('displayFilter'))
})

ipcMain.on('SETTINGS_DISPLAY_FILTER_WRITE', (_, values) => {
  settings.set('displayFilter', values)
})

ipcMain.on('SETTINGS_MAP_VIEWPORT_READ', event => {
  event.sender.send('SETTINGS_MAP_VIEWPORT', settings.get('mapViewport'))
})

ipcMain.on('SETTINGS_MAP_VIEWPORT_WRITE', (_, values) => {
  settings.set('mapViewport', values)
})
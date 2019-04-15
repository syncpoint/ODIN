const { ipcMain } = require('electron')
const { properties } = require('./user-settings')
const { DISPLAY_FILTER, MAP_VIEWPORT, TILE_PROVIDER } = require('./user-settings')

const reply = (event, channel) => values => event.sender.send(channel, values)

ipcMain.on('SETTINGS_DISPLAY_FILTER_READ', event => {
  properties(DISPLAY_FILTER).read().then(reply(event, 'SETTINGS_DISPLAY_FILTER'))
})

ipcMain.on('SETTINGS_DISPLAY_FILTER_WRITE', (_, values) => {
  properties(DISPLAY_FILTER).write(values)
})

ipcMain.on('SETTINGS_MAP_VIEWPORT_READ', event => {
  properties(MAP_VIEWPORT).read().then(reply(event, 'SETTINGS_MAP_VIEWPORT'))
})

ipcMain.on('SETTINGS_MAP_VIEWPORT_WRITE', (_, values) => {
  properties(MAP_VIEWPORT).write(values)
})

ipcMain.on('SETTINGS_TILE_PROVIDER_READ', event => {
  properties(TILE_PROVIDER).read().then(reply(event, 'SETTINGS_TILE_PROVIDER'))
})

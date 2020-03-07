import { app, BrowserWindow, ipcMain } from 'electron'
import url from 'url'
import path from 'path'
import tileProviders, { persist } from '../../main/tile-providers'

let childExists = false

const clickHandler = () => {
  if (childExists) return
  const child = new BrowserWindow({ modal: true, show: false, webPreferences: {
    nodeIntegration: true
  }})
  child.setMinimizable(false)
  child.setMaximizable(false)
  childExists = true

  const devServer = () => process.argv.indexOf('--noDevServer') === -1

  const indexURL = (devServer())
    ? url.format({
      protocol: 'http:',
      host: 'localhost:8080',
      pathname: 'tileProviders/index.html',
      slashes: true
    })
    : url.format({
      protocol: 'file:',
      pathname: path.join(app.getAppPath(), 'dist','tileProviders', 'index.html'),
      slashes: true
    })

  child.once('ready-to-show', child.show)
  
  const sendTileProviders = () => child.webContents.send('tile-providers-loaded', tileProviders())

  ipcMain.on('tile-providers-window-ready', sendTileProviders)
  // handle tile-provider (CRUD) changes
  ipcMain.on('tile-providers-changed', (event, providers) => persist(providers)) 

  child.once('close', () =>  {
    ipcMain.removeListener('tile-providers-window-ready', sendTileProviders)
    childExists = false
  })
  
  child.loadURL(indexURL)
}

export default {
    label: 'Manage Tile Providers ...',
    clickHandler: clickHandler
}

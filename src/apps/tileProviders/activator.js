import { BrowserWindow } from 'electron'
import url from 'url'
import tileProviders from '../../main/tile-providers'

const clickHandler = (menuItem, focusedWindow) => {
  const child = new BrowserWindow({ modal: true, show: false, webPreferences: {
    nodeIntegration: true
  } })
  child.setMinimizable(false)
  child.setMaximizable(false)

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

  child.loadURL(indexURL)
  child.once('ready-to-show', () => {
    child.show()
    child.webContents.send('tile-providers-loaded', tileProviders())
  })
  child.onbeforeunload = event => {
    console.log('should save tile-providers now ...')
  }
}

export default {
    label: 'Manage Tile Providers ...',
    clickHandler: clickHandler
}

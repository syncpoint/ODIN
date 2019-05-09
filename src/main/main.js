const path = require('path')
const url = require('url')
import { app, BrowserWindow } from 'electron'
import { K, noop } from '../shared/combinators'

const on = emitter => ([event, handler]) => emitter.on(event, handler)

let mainWindow

const createWindow = () => {
  const options = {
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  }

  let interval;

  mainWindow = K(new BrowserWindow(options))(window => {

    // hot deployment in development mode
    const hotDeployment = () =>
      process.defaultApp ||
      /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
      /[\\/]electron[\\/]/.test(process.execPath)

    const devServer = () => process.argv.indexOf('--noDevServer') === -1

    // NOTE: If browser complains about 'Not allowed to load local resource',
    //       the file is probable not there.

    // TODO: use `app.isPackaged` to enable HMR.

    const indexURL = (hotDeployment() && devServer()) ?
      url.format({
        protocol: 'http:',
        host: 'localhost:8080',
        pathname: 'index.html',
        slashes: true
      }) :
      url.format({
        protocol: 'file:',
        pathname: path.join(__dirname, 'dist', 'index.html'),
        slashes: true
      })

    window.loadURL(indexURL)
    window.on('close', () => {
      clearInterval(interval)
      mainWindow = null
    })

    window.once('ready-to-show', () => window.show())
    window.once('show', () => {
      // Show that IPC does work:
      interval = setInterval(() => window.webContents.send('time', new Date()), 1000)
    })
  })
}

;(() => {
  const quit = process.platform !== 'darwin' ? app.quit : noop
  const activate = mainWindow === null ? createWindow : noop

  Object.entries({
    'ready': createWindow,
    'window-all-closed': quit,
    'activate': activate
  }).forEach(on(app))
})()

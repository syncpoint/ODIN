import path from 'path'
import url from 'url'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import settings from 'electron-settings'
import projects from '../shared/projects'

/**
 * Facade for application windows/project state.
 * Encapsulates settings access.
 */
const APP_KEY = 'app'
const STATE_KEY = `${APP_KEY}.state`
const WINDOWS_KEY = `${STATE_KEY}.windows`
const windowKey = id => `${WINDOWS_KEY}.${id}`

/**
 * Merge current value (object) with supplied (map) function.
 */
const merge = keyPath => (fn, defaultvalue) => settings.set(keyPath, fn(settings.get(keyPath, defaultvalue)))

// TODO: unit test

let shuttingDown = false

const windowTitle = options => options.path ? path.basename(options.path) : 'ODIN - C2IS'


/**
 * create the project window.
 *
 * @param {*} options window options
 */
const createProjectWindow = async (options) => {

  const createWindow = (projectOptions) => {
    const devServer = process.argv.indexOf('--noDevServer') === -1
    const hotDeployment = process.defaultApp ||
      /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
      /[\\/]electron[\\/]/.test(process.execPath)

    const windowUrl = (hotDeployment && devServer)
      ? url.format({ protocol: 'http:', host: 'localhost:8080', pathname: 'index.html', slashes: true })
      : url.format({ protocol: 'file:', pathname: path.join(app.getAppPath(), 'dist', 'index.html'), slashes: true })

    const window = new BrowserWindow({
      ...projectOptions,
      title: windowTitle(projectOptions),
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    })

    const key = windowKey(window.id)
    merge(key)(props => ({ ...props, ...projectOptions }), {})

    const updateBounds = () => merge(key)(props => ({ ...props, ...window.getBounds() }))
    const deleteWindow = () => {
      // don't delete when shutting down the application.
      if (shuttingDown) return
      settings.delete(windowKey(window.id))
    }

    window.viewport = projectOptions.viewport
    window.path = projectOptions.path
    window.once('ready-to-show', () => window.show())
    window.once('close', deleteWindow)
    window.on('page-title-updated', event => event.preventDefault())
    window.on('move', updateBounds)
    window.on('resize', updateBounds)
    // TODO: support fullscreen

    window.loadURL(windowUrl)
  }

  if (options && options.path && projects.exists(options.path)) {
    return createWindow(options)
  }

  try {
    const projectPath = await projects.createProject(projects.brandNew())
    createWindow({ ...options, ...{ path: projectPath } })
  } catch (error) {
    dialog.showErrorBox('Error creating project folder', error.message)
  }
}
// listeners =>

const bootstrap = () => {
  app.on('before-quit', () => (shuttingDown = true))
  app.on('ready', () => {

    // Since window ids are not stable between sessions,
    // we clear state now and recreate it with current ids.
    const state = Object.values(settings.get(WINDOWS_KEY, {}))
    settings.delete(WINDOWS_KEY)

    // state contains the recently used project(s)
    if (state.length) state.forEach(createProjectWindow)
    else createProjectWindow(/* will create a new untiteled project */)
  })

  ipcMain.on('IPC_VIEWPORT_CHANGED', (event, viewport) => {
    const { id } = event.sender.getOwnerBrowserWindow()
    merge(windowKey(id))(props => ({ ...props, viewport }), {})
  })

  ipcMain.on('IPC_COMMAND_OPEN_PROJECT', (event, projectPath) => {
    const sender = event.sender.getOwnerBrowserWindow()
    if (sender.path === projectPath) return

    sender.close()
    createProjectWindow({ path: projectPath })
  })
}

export default bootstrap

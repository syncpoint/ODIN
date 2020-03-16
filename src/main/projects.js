import path from 'path'
import url from 'url'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import settings from 'electron-settings'
import * as R from 'ramda'
import { existsSync } from 'fs'


/**
 * Facade for application windows/project state.
 * Encapsulates settings access.
 */

const MAX_RECENT_PROJECTS = 5

const APP_KEY = 'app'
const STATE_KEY = `${APP_KEY}.state`
const WINDOWS_KEY = `${STATE_KEY}.windows`
const windowKey = id => `${WINDOWS_KEY}.${id}`
const RECENT_PROJECTS_KEY = `${STATE_KEY}.recent-projects`

const State = {}
State.update = key => (fn, defaultvalue) =>
  settings.set(key, fn(settings.get(key, defaultvalue)))

State.deleteAllWindows = () => settings.delete(WINDOWS_KEY)
State.allWindows = () => settings.get(WINDOWS_KEY, {})
State.deleteWindow = id => settings.delete(windowKey(id))
State.deleteRecentProjects = () => settings.set(RECENT_PROJECTS_KEY, [])
State.recentProjects = () => settings.get(RECENT_PROJECTS_KEY, [])
State.watch = (keyPath, handler) => settings.watch(keyPath, handler)

// TODO: unit test

/**
 * Project/window handling.
 * No direct access to settings beyond this point.
 */

let shuttingDown = false

const sendMessage = window => (event, ...args) => {
  if (!window) return
  window.send(event, args)
}

const windowTitle = options => options.path ? path.basename(options.path) : 'ODIN - C2IS'


/**
 * Open project window.
 *
 * @param {*} options window options
 */
const createProject = (options = {}) => {
  const devServer = process.argv.indexOf('--noDevServer') === -1
  const hotDeployment = process.defaultApp ||
    /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
    /[\\/]electron[\\/]/.test(process.execPath)

  const windowUrl = (hotDeployment && devServer)
    ? url.format({ protocol: 'http:', host: 'localhost:8080', pathname: 'index.html', slashes: true })
    : url.format({ protocol: 'file:', pathname: path.join(app.getAppPath(), 'dist', 'index.html'), slashes: true })

  const window = new BrowserWindow({
    ...options,
    title: windowTitle(options),
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  const key = windowKey(window.id)
  State.update(key)(props => ({ ...props, ...options }), {})

  const updateBounds = () => State.update(key)(props => ({ ...props, ...window.getBounds() }))
  const deleteWindow = () => {
    if (shuttingDown) return
    State.deleteWindow(window.id)
  }

  window.viewport = options.viewport
  window.path = options.path
  window.once('ready-to-show', () => window.show())
  window.once('close', deleteWindow)
  window.on('page-title-updated', event => event.preventDefault())
  window.on('move', updateBounds)
  window.on('resize', updateBounds)
  // TODO: support fullscreen

  window.loadURL(windowUrl)
  return window
}


/**
 * Open project path in current or new window.
 *
 * @param {*} window project window (optional)
 * @param {*} projectPath the path to a project (Optional. If given, the application will not open the chooseProjectPath dialog.)
 */
const openProject = (window, projectPath) => {

  const open = ({ canceled, filePaths = [] }) => {
    if (canceled) return
    if (!filePaths.length) return

    const path = filePaths[0]

    if (!existsSync(path)) {
      return dialog.showErrorBox('Path does not exist', `The project path ${path} does not exist.`)
    }

    // Check if project is already open in another window:
    const candidate = Object
      .entries(State.allWindows())
      .find(([_, value]) => value.path === path)

    if (candidate) return BrowserWindow.fromId(Number.parseInt(candidate[0])).focus()

    if (!window) createProject({ path })
    else {
      State.update(windowKey(window.id))(props => ({ ...props, path }), {})
      window.setTitle(windowTitle({ path }))
      sendMessage(window)('IPC_OPEN_PROJECT', path)
    }

    // Remember path in 'recent projects':
    // Add path to tail, make entries unique and cap to max size:
    const prepend = R.compose(R.slice(0, MAX_RECENT_PROJECTS), R.uniq, R.prepend(path))
    State.update(RECENT_PROJECTS_KEY)(prepend, [])
  }

  if (projectPath) {
    open({ filePaths: [projectPath] })
  } else {
    dialog.showOpenDialog(window, { properties: ['openDirectory'] })
      .then(open)
      .catch(/* TODO: handle */)
  }
}


// listeners =>

app.on('activate', () => createProject(/* empty project */))
app.on('before-quit', () => (shuttingDown = true))
app.on('ready', () => {

  // Since window ids are not stable between session,
  // we clear state now and recreate it with current ids.
  const state = Object.values(State.allWindows())
  State.deleteAllWindows()

  if (state.length) state.forEach(createProject)
  else createProject(/* empty project */)
})

ipcMain.on('IPC_VIEWPORT_CHANGED', (event, viewport) => {
  const { id } = event.sender.getOwnerBrowserWindow()
  State.update(windowKey(id))(props => ({ ...props, viewport }), {})
})

export default {
  createProject,
  openProject,
  clearRecentProjects: State.deleteRecentProjects,
  recentProjects: State.recentProjects,
  watchRecentProjects: handler => State.watch(RECENT_PROJECTS_KEY, handler)
}

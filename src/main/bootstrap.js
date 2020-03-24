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
const RECENT_WINDOW_KEY = `${STATE_KEY}.recentWindow`

/**
 * Merge current value (object) with supplied (map) function.
 */
const merge = keyPath => (fn, defaultvalue) => settings.set(keyPath, fn(settings.get(keyPath, defaultvalue)))

/**
 * the project id corresponds with the project folder name (which is a UUID)
 */
const projectId = projectPath => path.basename(projectPath)

/**
 * @param {*} projectPath the fully qualified filesystem path to the project folder
 */
const windowTitle = async (projectPath) => {
  const data = await projects.readMetadata(projectPath)
  return data.metadata.name
}

/**
 * create the project window.
 *
 * @param {*} options window options
 */
const createProjectWindow = async (options) => {

  const createWindow = async (projectOptions) => {
    const devServer = process.argv.indexOf('--noDevServer') === -1
    const hotDeployment = process.defaultApp ||
      /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
      /[\\/]electron[\\/]/.test(process.execPath)

    const windowUrl = (hotDeployment && devServer)
      ? url.format({ protocol: 'http:', host: 'localhost:8080', pathname: 'index.html', slashes: true })
      : url.format({ protocol: 'file:', pathname: path.join(app.getAppPath(), 'dist', 'index.html'), slashes: true })

    const title = await windowTitle(projectOptions.path)

    const window = new BrowserWindow({
      ...projectOptions,
      title: title,
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    })

    /* remember the window settings per project, so the key is the project folder name (which is a UUID) */
    const id = projectId(projectOptions.path)
    const key = windowKey(id)
    merge(key)(props => ({ ...props, ...projectOptions }), {})

    const updateBounds = () => merge(key)(props => ({ ...props, ...window.getBounds() }))

    /** the path property is required to identify the project */
    window.path = projectOptions.path
    window.viewport = projectOptions.viewport
    window.once('ready-to-show', () => {
      window.show()
      /* create a screenshot and save the image that will be used as a preview */
      /*
        TODO: choose a more appropriate point in time to create the screenshot
        if we close the window within the 5s this will throw an error
      */
      setTimeout(async () => {
        try {
          const nativeImage = await window.webContents.capturePage()
          projects.writePreview(projectOptions.path, nativeImage.toJPEG(75))
        } catch (error) {
          console.dir(error)
        }
      }, 5000)

      /*  Remember this window/project to be the most recent.
          We will use this key to identify the recent project and
          use it on startup ('app-ready') and when we switch projects ('IPC_SWITCH_PROJECT').
      */
      merge(RECENT_WINDOW_KEY)(() => projectOptions.path)
    })
    /*
      TODO: decide if the app should quit if we close the window
    */
    // window.once('close', deleteWindow)
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
    const projectPath = await projects.createProject()
    createWindow({ ...options, ...{ path: projectPath } })
  } catch (error) {
    dialog.showErrorBox('Error creating project folder', error.message)
  }
}

/**
 * registers all app listeners and loads either the last project used or creates a new one
 */
const bootstrap = () => {
  // app.on('before-quit', () => (shuttingDown = true))
  app.on('ready', () => {
    /* try to restore persisted window state */
    const state = Object.values(settings.get(WINDOWS_KEY, {}))

    if (!state || state.length === 0) {
      return createProjectWindow(/* will create a new untiteled project */)
    }

    const mostRecentProject = settings.get(RECENT_WINDOW_KEY)
    const recentProject = state.find(setting => setting.path === mostRecentProject)

    if (!recentProject) return createProjectWindow(/* will create a new untiteled project */)
    createProjectWindow(recentProject)
  })

  ipcMain.on('IPC_VIEWPORT_CHANGED', (event, viewport) => {
    const id = projectId(event.sender.getOwnerBrowserWindow().path)
    merge(windowKey(id))(props => ({ ...props, viewport }), {})
  })

  /* emitted by the renderer process in order to change projects */
  ipcMain.on('IPC_SWITCH_PROJECT', (event, projectPath) => {
    const sender = event.sender.getOwnerBrowserWindow()
    if (sender.path === projectPath) return
    sender.close()
    /*
      restore the window settings
      if no settings exist we create a default window
    */
    const id = projectId(projectPath)
    const persistedSettings = settings.get(windowKey(id), { path: projectPath })
    createProjectWindow(persistedSettings)
  })
}

export default bootstrap

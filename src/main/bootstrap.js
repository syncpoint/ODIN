import path from 'path'
import url from 'url'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import settings from 'electron-settings'
import projects from '../shared/projects'
import { exportProject, importProject } from './ipc/share-project'
import handleCreatePreview from './ipc/create-preview'

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
 * an indicator if the application will quit if the user closes the primary (last) window
 */
let appShallQuit = true

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

    /** the path property is required to identify the project */
    window.path = projectOptions.path

    /* remember the window settings per project, so the key is the project folder name (which is a UUID) */
    const id = projectId(projectOptions.path)
    const key = windowKey(id)
    merge(key)(props => ({ ...props, ...projectOptions }), {})

    const updateBounds = () => merge(key)(props => ({ ...props, ...window.getBounds() }))
    window.on('page-title-updated', event => event.preventDefault())
    window.on('move', updateBounds)
    window.on('resize', updateBounds)
    // TODO: support fullscreen

    /* restore the existing viewport if exists or maximize the window */
    if (projectOptions.viewport) {
      window.viewport = projectOptions.viewport
    } else {
      window.maximize()
    }

    window.once('ready-to-show', () => {
      window.show()
      /*  Remember this window/project to be the most recent.
          We will use this key to identify the recent project and
          use it on startup ('app-ready') and when we switch projects ('IPC_SWITCH_PROJECT').
      */
      merge(RECENT_WINDOW_KEY)(() => projectOptions.path)
    })

    /* (re)establish electron's normal "quit the app if no more windows are open" behavior */
    appShallQuit = true
    /* allow users to find their recently used projects access by data/time */
    projects.mergeMetadata(projectOptions.path, { lastAccess: new Date() })
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
    /*
      Setting the appId is required to allow desktop notifications on the Windows platform.
      Please make sure this value is THE SAME as in 'electron-builder.yml'.
    */
    app.setAppUserModelId('io.syncpoint.odin')

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

  app.on('window-all-closed', () => {
    if (appShallQuit) app.quit()
  })

  ipcMain.on('IPC_VIEWPORT_CHANGED', (event, viewport) => {
    const id = projectId(event.sender.getOwnerBrowserWindow().path)
    merge(windowKey(id))(props => ({ ...props, viewport }), {})
  })

  /* emitted by the renderer process in order to change projects */
  ipcMain.on('IPC_SWITCH_PROJECT', (event, projectPath) => {
    const sender = event.sender.getOwnerBrowserWindow()
    if (sender.path === projectPath) return
    /*
      prevent electron from quitting the application
      this will be restored to TRUE in the createProjectWindow function
    */
    appShallQuit = false
    sender.close()
    /*
      restore the window settings
      if no settings exist we create a default window
    */
    const id = projectId(projectPath)
    const persistedSettings = settings.get(windowKey(id), { path: projectPath })
    createProjectWindow(persistedSettings)
  })

  /*
    Emitted by the renderer process in order to save a preview
    image of the map. This image is used in the project management view.
  */
  ipcMain.on('IPC_CREATE_PREVIEW', handleCreatePreview)

  /* emitted by renderer/components/Management.js */
  ipcMain.on('IPC_EXPORT_PROJECT', exportProject)
  ipcMain.on('IPC_IMPORT_PROJECT', importProject)

}

export default bootstrap

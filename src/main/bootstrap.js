import path from 'path'
import { URL } from 'url'

import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import settings from 'electron-settings'
import projects from '../shared/projects'
import { exportProject, importProject } from './ipc/share-project'
import { exportLayer } from './ipc/share-layer'
import { viewAsPng } from './ipc/share-view'
import autoUpdate from './autoUpdate'
import handleCreatePreview from './ipc/create-preview'
import { handleNavigationEvent } from './navigationEvent'
import i18n from '../i18n'
import './ipc/source-descriptors'

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

let mainWindow

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

const sendi18Info = (receiver, lng) => {
  receiver.webContents.send('IPC_LANGUAGE_CHANGED', { lng: lng, resourceBundle: i18n.getResourceBundle(lng, 'web') })
}


/**
 *
 */
const createWindow = async (projectOptions) => {
  const devServer = process.argv.indexOf('--noDevServer') === -1
  const hotDeployment = process.defaultApp ||
    /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
    /[\\/]electron[\\/]/.test(process.execPath)

  const windowUrl = (hotDeployment && devServer)
    ? new URL('http://localhost:8080/index.html')
    : new URL(`file:${path.join(app.getAppPath(), 'dist', 'index.html')}`)

  const title = await windowTitle(projectOptions.path)

  mainWindow = new BrowserWindow({
    ...projectOptions,
    title: title,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: !devServer
    }
  })

  /** the path property is required to identify the project */
  mainWindow.path = projectOptions.path

  /* remember the window settings per project, so the key is the project folder name (which is a UUID) */
  const id = projectId(projectOptions.path)
  const key = windowKey(id)
  merge(key)(props => ({ ...props, ...projectOptions }), {})

  const updateBounds = () => merge(key)(props => ({ ...props, ...mainWindow.getBounds() }))
  mainWindow.on('page-title-updated', event => event.preventDefault())
  mainWindow.on('move', updateBounds)
  mainWindow.on('resize', updateBounds)

  // TODO: support fullscreen

  /* restore the existing viewport if exists or maximize the window */
  if (projectOptions.viewport) {
    mainWindow.viewport = projectOptions.viewport
  } else {
    mainWindow.maximize()
  }

  /* send app setting for i18n to window */
  const languageChangedHandler = lng => {
    sendi18Info(mainWindow, lng)
  }
  i18n.on('languageChanged', languageChangedHandler)
  mainWindow.once('close', () => {
    mainWindow = null
    i18n.off('languageChanged', languageChangedHandler)
  })

  /* (re)establish electron's normal "quit the app if no more windows are open" behavior */
  appShallQuit = true

  /* allow users to find their recently used projects access by data/time */
  projects.mergeMetadata(projectOptions.path, { lastAccess: new Date() })

  /*  Remember this window/project to be the most recent.
        We will use this key to identify the recent project and
        use it on startup ('app-ready') and when we switch projects ('IPC_SWITCH_PROJECT').
    */
  merge(RECENT_WINDOW_KEY)(() => projectOptions.path)
  await mainWindow.loadURL(windowUrl.href)
  mainWindow.show()
}


/**
 * create the project window.
 *
 * @param {*} options window options
 */
const createProjectWindow = async (options) => {
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
 * Handle event app/ready.
 */
const ready = () => {

  /*
    Setting the appId is required to allow desktop notifications on the Windows platform.
    Please make sure this value is THE SAME as in 'electron-builder.yml'.
  */
  app.setAppUserModelId('io.syncpoint.odin')

  /*
    Checking for updates is always executed but will only do it's job if the user has enabled
    the autoUpdate option.
  */
  autoUpdate.checkForUpdates()

  /* try to restore persisted window state */
  const state = Object.values(settings.get(WINDOWS_KEY, {}))

  if (!state || state.length === 0) {
    return createProjectWindow(/* will create a new untiteled project */)
  }

  const mostRecentProject = settings.get(RECENT_WINDOW_KEY)
  const recentProject = state.find(setting => projectId(setting.path) === projectId(mostRecentProject))

  if (!recentProject) return createProjectWindow(/* will create a new untiteled project */)

  /*
    fix/423: Since we also deploy ODIN as a Snapcraft package we must ensure that the project
    path is always relative to ODIN's home directory. Snap packages change this path on every release
    so we must re-calculate the absolute path.
  */
  const absoluteProjectPath = projects.pathFromId(projectId(recentProject.path))
  createProjectWindow({ ...recentProject, ...{ path: absoluteProjectPath } })
}

const windowAllClosed = () => {
  if (!appShallQuit) return
  autoUpdate.cancel()
  app.quit()
}

const secondInstance = (/* event, commandLine, workingDirectory */) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  } else {
    createProjectWindow()
  }
}

const webContentsCreated = (_, contents) => {
  contents.on('new-window', handleNavigationEvent)
  contents.on('will-navigate', handleNavigationEvent)
  contents.on('will-redirect', handleNavigationEvent)
}

const ipcViewportChanged = (event, viewport) => {
  const id = projectId(event.sender.getOwnerBrowserWindow().path)
  merge(windowKey(id))(props => ({ ...props, viewport }), {})
}

const ipcSwitchProject = async (event, projectPath) => {
  const sender = event.sender.getOwnerBrowserWindow()
  if (sender.path === projectPath) return

  /*
    prevent electron from quitting the application
    this will be restored to TRUE in the createProjectWindow function
  */
  appShallQuit = false

  // Wait for window to be closed, before creating a new one.
  // Else mainWindow reference would be overwritten since
  // creating new windows kicks in before old window is closed.

  await new Promise((resolve) => {
    sender.once('close', resolve)
    sender.close()
  })

  /*
    restore the window settings
    if no settings exist we create a default window
  */
  const id = projectId(projectPath)
  const absoluteProjectPath = projects.pathFromId(id)
  const persistedSettings = settings.get(windowKey(id), { path: absoluteProjectPath })
  persistedSettings.path = absoluteProjectPath
  createProjectWindow(persistedSettings)
}

const ipcAppRenderingCompleted = event => {
  const sender = event.sender.getOwnerBrowserWindow()
  sendi18Info(sender, i18n.language)
}

/**
 * registers all app listeners and loads either the last project used or creates a new one
 */
const bootstrap = () => {
  app.on('ready', ready)
  app.on('window-all-closed', windowAllClosed)
  app.on('second-instance', secondInstance)

  /* security */
  app.on('web-contents-created', webContentsCreated)

  ipcMain.on('IPC_VIEWPORT_CHANGED', ipcViewportChanged)

  /* emitted by the renderer process in order to change projects */
  ipcMain.on('IPC_SWITCH_PROJECT', ipcSwitchProject)

  /*
    Emitted by the renderer process in order to save a preview
    image of the map. This image is used in the project management view.
  */
  ipcMain.on('IPC_CREATE_PREVIEW', handleCreatePreview)

  /* emitted by renderer/components/Management.js */
  ipcMain.on('IPC_EXPORT_PROJECT', exportProject)
  ipcMain.on('IPC_IMPORT_PROJECT', importProject)

  ipcMain.on('IPC_EXPORT_LAYER', exportLayer)

  /* share view */
  ipcMain.on('IPC_SHARE_PNG', viewAsPng)

  /* emitted by renderer/App */
  ipcMain.on('IPC_APP_RENDERING_COMPLETED', ipcAppRenderingCompleted)
}

export default bootstrap

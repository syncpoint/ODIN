import { ipcRenderer, remote } from 'electron'
import fs from 'fs'
import path from 'path'
import { List } from 'immutable'
import evented from './evented'

/** Current project directory. */
let currentProject /* undefined: no project open. */

/**
 * Preferences (in-memory).
 * Should always be in sync with file: preferences.json
 */
let preferences = {}

/** Open/close event listeners. */
let listeners = List()

const register = listener => {
  listeners = listeners.push(listener)
  if (currentProject) setImmediate(() => listener('open'))
}


/**
 * Load preferences for open project.
 */
const loadPreferences = () => {
  if (!currentProject) return
  const location = path.join(currentProject, 'preferences.json')
  preferences = JSON.parse(fs.readFileSync(location))
}


/**
 * Update in-memory preferences and sync to file.
 * @param {object} args partial preference values
 */
const updatePreferences = args => {
  preferences = { ...preferences, ...args }
  const location = path.join(currentProject, 'preferences.json')
  fs.writeFileSync(location, JSON.stringify(preferences, null, 2))
}


/**
 * Close project.
 */
const closeProject = () => {
  if (!currentProject) return
  listeners.forEach(listener => listener('close'))
  currentProject = undefined
}


/**
 * Open project from directory.
 * @param {string} project project directory
 */
const openProject = project => {
  if (currentProject) closeProject()
  currentProject = project

  // NOTE: Defer message, so OSD has a chance to register event handler:
  setImmediate(() => evented.emit('OSD_MESSAGE', { message: path.basename(project), slot: 'A1' }))
  loadPreferences()
  listeners.forEach(listener => listener('open'))
}


/**
 * Read (absolute) overlay file names from open project.
 */
const overlays = () => {
  if (!currentProject) return []

  const dir = path.join(currentProject, 'overlays')

  return fs.readdirSync(dir)
    .filter(filename => filename.endsWith('.json'))
    .map(filename => path.join(dir, filename))
}

window.addEventListener('beforeunload', () => closeProject())
ipcRenderer.on('IPC_OPEN_PROJECT', (_, [project]) => openProject(project))

// Wait until next tick for other components to be ready:
setImmediate(() => {
  const { path: project } = remote.getCurrentWindow()
  if (project) openProject(project)
})

export default {
  register,
  overlays,
  preferences: () => preferences,
  updatePreferences
}

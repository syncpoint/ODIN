import { remote } from 'electron'
import fs from 'fs'
import path from 'path'
import { List } from 'immutable'
import evented from './evented'

const DEFAULT_PREFERENCES = {
  viewport: {
    zoom: 10.29344451062811,
    center: [
      15.517894187589647,
      48.21987507926943
    ]
  }
}

/** Current project directory. */
let currentProject /* undefined: no project open. */

/**
 * Preferences (in-memory).
 * Should always be in sync with file: preferences.json
 */
let preferences = DEFAULT_PREFERENCES

/** Open/close event listeners. */
let listeners = List()

const register = listener => {
  listeners = listeners.push(listener)
  if (currentProject) setTimeout(() => listener('open'), 0)
}


/**
 * Load preferences for open project.
 */
const loadPreferences = () => {
  if (!currentProject) return
  const location = path.join(currentProject, 'preferences.json')
  if (fs.existsSync(location)) preferences = JSON.parse(fs.readFileSync(location))
}


/**
 * Update in-memory preferences and sync to file.
 * @param {object} args partial preference values
 */
const updatePreferences = args => {
  if (!currentProject) return
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

  const projectName = remote.getCurrentWindow().getTitle()
  const updateProject = () => evented.emit('OSD_MESSAGE', { message: projectName, slot: 'A1' })
  // NOTE: Defer message, so OSD has a chance to register event handler:
  setTimeout(updateProject, 0)

  loadPreferences()
  listeners.forEach(listener => listener('open'))
}


/**
 * Read (absolute) layer file names from open project.
 */
const layerFiles = () => {
  if (!currentProject) return []

  const dir = path.join(currentProject, 'layers')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(filename => filename.endsWith('.json'))
    .map(filename => path.join(dir, filename))
}

window.addEventListener('beforeunload', () => closeProject())

// Wait until next tick for other components to be ready:
setTimeout(() => {
  const { path: project } = remote.getCurrentWindow()
  if (project) openProject(project)
}, 0)

export default {
  register,
  layerFiles,
  preferences: () => preferences,
  updatePreferences
}

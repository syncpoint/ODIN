import { remote } from 'electron'
import path from 'path'
import fs from 'fs'

const DEFAULT_PREFERENCES = {
  viewport: {
    zoom: 10.29344451062811,
    center: [
      15.517894187589647,
      48.21987507926943
    ]
  }
}

const projectPath = () => remote.getCurrentWindow().path

let reducers = []

const emit = event => {
  reducers.forEach(reducer => setImmediate(() => reducer(event)))
}

/**
 * Load preferences for open project.
 */
const loadPreferences = () => {
  const location = path.join(projectPath(), 'preferences.json')
  if (!fs.existsSync(location)) return DEFAULT_PREFERENCES
  return JSON.parse(fs.readFileSync(location))
}

/**
 * Update in-memory preferences and sync to file.
 * @param {object} args partial preference values
 */
const writePreferences = preferences => {
  const location = path.join(projectPath(), 'preferences.json')
  fs.writeFileSync(location, JSON.stringify(preferences, null, 2))
}

/**
 * Preferences (in-memory).
 * Should always be in sync with file: preferences.json
 */
const preferences = loadPreferences()

const set = (key, value) => {
  preferences[key] = value
  writePreferences(preferences)
  emit({ type: 'set', key, value })
}

const unset = key => {
  delete preferences[key]
  writePreferences(preferences)
  emit({ type: 'unset', key })
}

const register = reducer => {
  reducers = [...reducers, reducer]
  setImmediate(() => reducer({ type: 'preferences', preferences }))
}

const deregister = reducer => {
  reducers = reducers.filter(x => x !== reducer)
}

export default {
  register,
  deregister,
  set,
  unset,
  get: key => key ? preferences[key] : preferences
}

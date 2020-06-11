import { loadPreferences, writePreferences } from './io'

const DEFAULT_PREFERENCES = {
  activeLayer: 'Default Layer',
  viewport: {
    zoom: 10.29344451062811,
    center: [
      15.517894187589647,
      48.21987507926943
    ]
  }
}


let reducers = []

const emit = event => {
  reducers.forEach(reducer => setImmediate(() => reducer(event)))
}


/**
 * Preferences (in-memory).
 * Should always be in sync with file: preferences.json
 */
const preferences = loadPreferences(DEFAULT_PREFERENCES)

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

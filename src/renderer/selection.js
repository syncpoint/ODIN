// Track selections throughout the application.
// Selections are URIs.
import EventEmitter from 'events'

// Current selections.
let state = []
const evented = new EventEmitter()

/**
 * select :: [uri] -> unit
 * Add selections.
 */
evented.select = uris => {
  if (!uris) return
  if (!Array.isArray(uris)) throw new Error('invalid argument; array expected')
  if (uris.length === 0) return
  if (uris.some(x => typeof x !== 'string')) throw new Error('invalid argument; string element expected')

  const additions = uris.filter(x => !state.includes(x))

  state = [...state, ...additions]
  if (additions.length) evented.emit('selected', additions)
}

/**
 * deselect :: () => unit
 * deselect :: [uri] => unit
 * Remove all or given selections.
 */
evented.deselect = uris => {
  if (uris && !Array.isArray(uris)) throw new Error('invalid argument; array expected')
  if (uris && uris.some(x => typeof x !== 'string')) throw new Error('invalid argument; string element expected')

  const removals = uris
    ? uris.filter(x => state.includes(x))
    : state

  state = state.filter(x => !removals.includes(x))
  if (removals.length) evented.emit('deselected', removals)
}

evented.isEmpty = () => state.length === 0
evented.isSelected = uri => state.includes(uri)

evented.selected = prefix => {
  const p = prefix
    ? s => s.startsWith(prefix)
    : () => true
  return state.filter(p)
}

export default evented

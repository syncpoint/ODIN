import Mousetrap from 'mousetrap'
import evented from '../evented'
import selection from './App.selection'

let clipboard = {}

// Behavior is defined through these callbacks:
//  name/context: string
//  escape: event -> unit
//  delete: event -> unit
//  click (map): event -> unit

// Behavior stack.
// DEFAULT behavior cannot be removed, nor replaced.
const behaviors = []

const dispatch = (handler, event) => {
  const behavior = behaviors[behaviors.length - 1]
  if (!behavior[handler]) return
  behavior[handler](event)
}

const push = behavior => behaviors.push(behavior)

const pop = context => {
  if (behaviors[behaviors.length - 1].name === context) {
    behaviors.pop()
  } else { /* Alarmstufe: rot! */ }
}

const init = map => {

  Mousetrap.bind(['escape'], event => {
    dispatch('escape', event)
  })

  Mousetrap.bind('command+backspace', event => {
    dispatch('delete', event)
  })

  Mousetrap.bind('del', event => {
    dispatch('delete', event)
  })

  map.on('click', event => {
    dispatch('click', event)
  })

  // Clipbaord.

  Mousetrap.bind(['mod+c'], () => {
    if (!selection.selected()) return
    if (!selection.selected().copy) return
    clipboard = selection.selected().copy()
  })

  Mousetrap.bind(['mod+x'], () => {
    if (!selection.selected()) return
    if (!selection.selected().cut) return
    clipboard = selection.selected().cut()
  })

  Mousetrap.bind(['mod+v'], () => {
    const { type, ...properties } = clipboard
    if (!type) return
    evented.emit('CLIPBOARD_PASTE', type, properties)
  })

  push({
    context: 'DEFAULT',
    escape: () => selection.deselect(),
    delete: () => {
      // When selection has delete interface -> do it!
      if (!selection.selected()) return
      if (!selection.selected().delete) return
      selection.selected().delete()
    },
    click: () => selection.deselect()
  })
}

export default {
  init,
  push,
  pop
}

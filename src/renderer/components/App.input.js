import Mousetrap from 'mousetrap'
import evented from '../evented'
import selection from './App.selection'

let clipboard = {}

// Behavior is defined through these callbacks:
//  escape: event -> unit
//  delete: event -> unit
//  click (map): event -> unit

let defaultBehavior
let secondaryBehavior
const behavior = () => secondaryBehavior || defaultBehavior

const dispatch = (handler, event) => {
  if (!behavior()[handler]) return
  behavior()[handler](event)
}

const push = behavior => (secondaryBehavior = behavior)
const pop = () => (secondaryBehavior = null)

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
    if (selection.empty()) return
    clipboard = selection.selected().map(selected => ({
      properties: selected.properties(),
      paste: selected.paste
    }))
  })

  Mousetrap.bind(['mod+x'], () => {
    if (selection.empty()) return
    clipboard = selection.selected().map(selected => ({
      properties: selected.properties(),
      paste: selected.paste
    }))
    selection.selected().forEach(selected => selected.delete())
  })

  Mousetrap.bind(['mod+v'], () => {
    clipboard.forEach(({ properties, paste }) => paste(properties))
  })

  defaultBehavior = {
    escape: () => selection.deselect(),
    delete: () => {
      if (selection.empty()) return
      selection.selected().forEach(selected => selected.delete())
    },
    click: () => selection.deselect()
  }
}

evented.on('MAP_CREATED', init)

export default {
  push,
  pop
}

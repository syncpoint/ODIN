import Mousetrap from 'mousetrap'
import { ipcRenderer } from 'electron'
import evented from './evented'
import { K, noop } from '../shared/combinators'
import selection from './selection'
import undo from './undo'

const clipboardHandlers = {}

export const registerHandler = (scheme, handler) =>
  (clipboardHandlers[scheme] = handler)

/**
 * editSelectAll :: () -> unit
 */
const editSelectAll = () => {
  selection.deselect()

  const ids = Object
    .values(clipboardHandlers)
    .flatMap(handler => (handler.selectAll && handler.selectAll()) || [])

  selection.select(ids)
}

/**
 * editDelete :: () -> unit
 * Delete selected features.
 */
const editDelete = () => Object
  .values(clipboardHandlers)
  .forEach(handler => handler.delete && handler.delete())

/**
 * editCut :: () -> unit
 * Write current selection to clipboard and delete selected features.
 */
const editCut = () => {
  const content = Object
    .entries(clipboardHandlers)
    .reduce((acc, [scheme, handler]) => K(acc)(acc => {
      const content = handler.cut()
      if (content && content.length) acc[scheme] = content
    }), {})

  ipcRenderer.send('IPC_CLIPBOARD_WRITE', content)
}

/**
 * editCopy :: () -> unit
 * Write current selection to clipboard.
 */
const editCopy = () => {
  const content = Object
    .entries(clipboardHandlers)
    .reduce((acc, [scheme, handler]) => K(acc)(acc => {
      const content = handler.copy()
      if (content && content.length) acc[scheme] = content
    }), {})

  ipcRenderer.send('IPC_CLIPBOARD_WRITE', content)
}

/**
 * editPaste :: () -> unit
 * Insert features from clipboard.
 */
const editPaste = async () => {
  const content = await ipcRenderer.invoke('IPC_CLIPBOARD_READ')
  Object.entries(content)
    .forEach(([scheme, content]) => clipboardHandlers[scheme].paste(content))
}


// Block certain ops when text input field is focused.

const activeElement = () => document.activeElement
const inputFocused = () => activeElement() instanceof HTMLInputElement
const block = p => fn => () => (p() ? noop : fn)()

document.addEventListener('cut', () => evented.emit('EDIT_CUT'))
document.addEventListener('copy', () => evented.emit('EDIT_COPY'))
document.addEventListener('paste', () => evented.emit('EDIT_PASTE'))

evented.on('EDIT_CUT', block(inputFocused)(editCut))
evented.on('EDIT_COPY', block(inputFocused)(editCopy))
evented.on('EDIT_PASTE', block(inputFocused)(editPaste))
evented.on('EDIT_SELECT_ALL', block(inputFocused)(editSelectAll))
evented.on('EDIT_UNDO', block(inputFocused)(undo.undo))
evented.on('EDIT_REDO', block(inputFocused)(undo.redo))

Mousetrap.bind('del', editDelete) // macOS: fn+backspace
Mousetrap.bind('command+backspace', editDelete)
Mousetrap.bind('esc', () => selection.deselect())

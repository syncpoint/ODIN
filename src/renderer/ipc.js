import { ipcRenderer } from 'electron'
import evented from './evented'

const emit = eventName => () => evented.emit(eventName)

ipcRenderer.on('IPC_EDIT_UNDO', emit('EDIT_UNDO'))
ipcRenderer.on('IPC_EDIT_REDO', emit('EDIT_REDO'))
ipcRenderer.on('IPC_EDIT_SELECT_ALL', emit('EDIT_SELECT_ALL'))
ipcRenderer.on('IPC_EDIT_DELETE', emit('EDIT_DELETE'))
ipcRenderer.on('IPC_EDIT_CUT', emit('EDIT_CUT'))
ipcRenderer.on('IPC_EDIT_COPY', emit('EDIT_COPY'))
ipcRenderer.on('IPC_EDIT_PASTE', emit('EDIT_PASTE'))

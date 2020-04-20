import { ipcMain } from 'electron'

let buffer

ipcMain.on('IPC_CLIPBOARD_WRITE', (_, content) => {
  buffer = content
})

ipcMain.on('IPC_CLIPBOARD_READ', (event) => {
  event.returnValue = buffer
})

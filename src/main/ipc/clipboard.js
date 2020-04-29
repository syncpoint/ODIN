import { ipcMain } from 'electron'

let buffer

ipcMain.on('IPC_CLIPBOARD_WRITE', (_, content) => {
  buffer = content
})

// NOTE: result might be undefined.
ipcMain.handle('IPC_CLIPBOARD_READ', () => buffer)

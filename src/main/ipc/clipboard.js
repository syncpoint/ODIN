import { ipcMain, clipboard } from 'electron'

let buffer

ipcMain.on('IPC_CLIPBOARD_WRITE', (_, content) => {
  buffer = content
  if (content.global)
    clipboard.writeText(JSON.stringify(content.global))
})

// NOTE: result might be undefined.
ipcMain.handle('IPC_CLIPBOARD_READ', () => buffer)

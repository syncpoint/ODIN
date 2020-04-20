import { ipcMain } from 'electron'

let buffer

ipcMain.on('IPC_CLIPBOARD_WRITE', (_, content) => {
  console.log('IPC_CLIPBOARD_WRITE', content)
  buffer = content
})

ipcMain.on('IPC_CLIPBOARD_READ', (event) => {
  console.log('IPC_CLIPBOARD_READ')
  event.returnValue = buffer
})

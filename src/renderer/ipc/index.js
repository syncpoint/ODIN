import { ipcRenderer } from 'electron'

ipcRenderer.on('IPC_OPEN_PROJECT', (_, [path]) => {
  console.log('IPC_OPEN_PROJECT', path)
})

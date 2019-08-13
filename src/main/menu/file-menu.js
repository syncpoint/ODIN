import { sendMessage } from './ipc'
import preferences from './preferences-submenu'

const menu = {
  label: 'File',
  submenu: [
    {
      label: 'Import Layer...',
      click: sendMessage('COMMAND_IMPORT_LAYER')
    }
  ]
}

if (process.platform !== 'darwin') {
  menu.submenu.push({ type: 'separator' })
  menu.submenu.push(preferences)
  menu.submenu.push({ type: 'separator' })
  menu.submenu.push({ role: 'quit' })
}

export default menu

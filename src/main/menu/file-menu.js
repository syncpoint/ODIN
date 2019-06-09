import { sendMessage } from './ipc'
import preferences from './preferences-submenu'

const menu = {
  label: 'File',
  submenu: [
    {
      label: 'New',
      submenu: [
        {
          label: 'Point of Interest',
          click: sendMessage('COMMAND_NEW_POI')
        },
        {
          label: 'Area of Interest',
          click: sendMessage('COMMAND_NEW_AOI'),
          enabled: false
        },
        { type: 'separator' },
        {
          label: 'Create Bookmark',
          accelerator: 'CmdOrCtrl+B',
          click: sendMessage('COMMAND_ADD_BOOKMARK')
        }
      ]
    },
    { type: 'separator' },
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

import { app } from 'electron'
import preferences from './preferences-submenu'

const menu = {
  label: app.getName(),
  submenu: [
    { role: 'about' },
    { type: 'separator' },
    preferences,
    { type: 'separator' },
    { role: 'services' },
    { type: 'separator' },
    { role: 'hide' },
    { role: 'hideothers' },
    { role: 'unhide' },
    { type: 'separator' },
    { role: 'quit' }
  ]
}

export default process.platform === 'darwin' ? menu : null

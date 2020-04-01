// darwin only.
import { app } from 'electron'

const menu = i18n => {
  return {
    label: app.name,
    submenu: [
      { role: 'about', label: i18n.t('app.about', { name: app.name }) },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide', label: i18n.t('app.hide', { name: app.name }) },
      { role: 'hideothers', label: i18n.t('app.hideOthers') },
      { role: 'unhide', label: i18n.t('app.unhide', { name: app.name }) },
      { type: 'separator' },
      { role: 'quit', label: i18n.t('app.quit', { name: app.name }) }
    ]
  }
}

export default process.platform === 'darwin' ? menu : null

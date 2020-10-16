import { app } from 'electron'
import autoUpdate from '../autoUpdate'


const menu = i18n => {
  const m = {
    label: app.name,
    submenu: [
      { role: 'about', label: i18n.t('app.about', { name: app.name }) },
      {
        type: 'checkbox',
        checked: autoUpdate.isEnabled(),
        label: i18n.t('autoUpdate.option'),
        click: () => autoUpdate.setEnabled(!autoUpdate.isEnabled())
      }
    ]
  }

  if (process.platform === 'darwin') {
    const darwinSubMenus = [
      { type: 'separator' },
      { role: 'hide', label: i18n.t('app.hide', { name: app.name }) },
      { role: 'hideothers', label: i18n.t('app.hideOthers') },
      { role: 'unhide', label: i18n.t('app.unhide', { name: app.name }) }
    ]
    m.submenu = [...m.submenu, ...darwinSubMenus]
  }

  m.submenu = [
    ...m.submenu,
    ...[
      { type: 'separator' },
      { role: 'quit', label: i18n.t('app.quit', { name: app.name }) }
    ]
  ]

  return m
}

export default menu

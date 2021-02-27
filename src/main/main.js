/* eslint-disable dot-notation */

import { Menu, ipcMain } from 'electron'
import { buildFromTemplate } from '../main/menu/menu'
import settings from 'electron-settings'
import bootstrap from './bootstrap'
import i18n, { languageKey } from '../i18n'
import config from '../shared/config'
import './ipc/clipboard'

/*  As of version 8.2 electron does not support adding/removing menu items dynamically.
    In order to add/remove recently used projects we need to rebuild and
    set the application menu.
*/

const buildApplicationMenu = () => {
  const menu = buildFromTemplate(i18n)
  Menu.setApplicationMenu(menu)
}

i18n.on('initialized', () => {
  /*
    By using an environment variable or a ".env" file users may change the language used.
    The ".env" file must be placed in the working directory and is NOT part of the
    software distribution.
  */

  i18n.on('languageChanged', lng => {
    settings.set(languageKey, lng)
    buildApplicationMenu()
  })

  i18n.changeLanguage(config.language || settings.get(languageKey, 'en'))
  bootstrap()
})

ipcMain.on('IPC_GRID_TOGGLED', (event, type) => {
  const menu = buildFromTemplate(i18n, { grid: type })
  Menu.setApplicationMenu(menu)
})

ipcMain.on('IPC_LABELS_TOGGLED', (event, show) => {
  const menu = buildFromTemplate(i18n, { label: show })
  Menu.setApplicationMenu(menu)
})

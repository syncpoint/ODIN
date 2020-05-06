/* eslint-disable dot-notation */

import { app, Menu, ipcMain } from 'electron'
import { buildFromTemplate } from '../main/menu/menu'
import settings from 'electron-settings'
import bootstrap from './bootstrap'
import i18n, { languageKey } from '../i18n'
import config from '../shared/config'
import './ipc/clipboard'


// Disable for production:
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// Silence:
// (electron) The default value of app.allowRendererProcessReuse is deprecated,
// it is currently "false".  It will change to be "true" in Electron 9.
// For more information please check https://github.com/electron/electron/issues/18397

// NOTE: Must be currently false to not crash renderer because of GEOSJS.
app.allowRendererProcessReuse = false // `false` also removes deprecation message

/*  As of version 8.2 electron does not support adding/removing menu items dynamically.
    In order to add/remove recently used projects we need to rebuild and
    set the application menu.
*/

const buildApplicationMenu = () => {
  const menu = buildFromTemplate(i18n)
  Menu.setApplicationMenu(menu)
}

i18n.on('languageChanged', lng => {
  settings.set(languageKey, lng)
  buildApplicationMenu()
})

i18n.on('initialized', () => {
  /*
    By using an environment variable or a ".env" file users may change the language used.
    The ".env" file must be placed in the working directory and is NOT part of the
    software distribution.
  */
  i18n.changeLanguage(config.language || settings.get(languageKey, 'en'))
  bootstrap()
})

ipcMain.on('IPC_GRID_TOGGLED', (event, type) => {
  const menu = buildFromTemplate(i18n, { grid: type })
  Menu.setApplicationMenu(menu)
})

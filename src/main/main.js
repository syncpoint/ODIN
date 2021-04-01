import { Menu, ipcMain, app } from 'electron'
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

const setApplicationMenu = (args = {}) => {
  const menu = buildFromTemplate(i18n, args)
  Menu.setApplicationMenu(menu)
}

const languageChanged = lng => {
  settings.set(languageKey, lng)
  setApplicationMenu()
}

const initialized = () => {

  /*
    By using an environment variable or a ".env" file users may change the language used.
    The ".env" file must be placed in the working directory and is NOT part of the
    software distribution.
  */

  i18n.on('languageChanged', languageChanged)
  i18n.changeLanguage(config.language || settings.get(languageKey, 'en'))
  bootstrap()
}


// Prevent more than once process instance from running.
if (!app.requestSingleInstanceLock()) app.quit()
else {
  i18n.on('initialized', initialized)
  ipcMain.on('IPC_GRID_TOGGLED', (_, type) => setApplicationMenu({ grid: type }))
  ipcMain.on('IPC_LABELS_TOGGLED', (_, show) => setApplicationMenu({ labels: show }))
}

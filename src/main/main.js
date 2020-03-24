/* eslint-disable dot-notation */

import { app, Menu } from 'electron'
import { buildFromTemplate } from '../main/menu/menu'
import settings from 'electron-settings'
import bootstrap from './bootstrap'

// Disable for production:
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// Silence:
// (electron) The default value of app.allowRendererProcessReuse is deprecated,
// it is currently "false".  It will change to be "true" in Electron 9.
// For more information please check https://github.com/electron/electron/issues/18397

// NOTE: Must be currently false to not crash renderer because of GEOSJS.
app.allowRendererProcessReuse = false // `false` also removes deprecation message

/*  As of version 8.1 electron does not support adding/removing menu items dynamically.
    In order to add/remove recently used projects we need to rebuild and
    set the application menu.
*/
const buildApplicationMenu = () => Menu.setApplicationMenu(buildFromTemplate(settings))
buildApplicationMenu()
bootstrap()

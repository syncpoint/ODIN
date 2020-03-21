import { Menu } from 'electron'
import applicationMenu from './application-menu'
// import fileMenu from './file-menu'
import viewMenu from './view-menu'
import windowMenu from './window-menu'
// import editMenu from './edit-menu'
// import helpMenu from './help-menu'
// import goMenu from './go-menu'

const template = settings => ([
  // darwin only (must be filtered for other platforms)
  applicationMenu,
  // fileMenu(),
  // editMenu,
  viewMenu(settings),
  // goMenu,
  windowMenu
  // helpMenu
])

export const buildFromTemplate = settings =>
  // filter null entries (darwin only):
  Menu.buildFromTemplate(template(settings).filter(x => x))

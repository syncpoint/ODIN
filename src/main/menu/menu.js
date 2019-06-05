import { Menu } from 'electron'
import windowMenu from './window-menu'
import editMenu from './edit-menu'
import helpMenu from './help-menu'
import goMenu from './go-menu'
import viewMenu from './view-menu'
import applicationMenu from './application-menu'
import fileMenu from './file-menu'

const template = [
  // darwin only (must be filtered for other platforms)
  applicationMenu,

  fileMenu,
  editMenu,
  viewMenu,
  goMenu,
  windowMenu,
  helpMenu
]

export const buildFromTemplate = () =>
  // filter null entries (darwin only):
  Menu.buildFromTemplate(template.filter(x => x))

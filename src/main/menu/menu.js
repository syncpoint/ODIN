import { Menu } from 'electron'
import applicationMenu from './application-menu'
import projectsMenu from './projects-menu'
import viewMenu from './view-menu'
import windowMenu from './window-menu'
import editMenu from './edit-menu'
// import helpMenu from './help-menu'
// import goMenu from './go-menu'

const template = settings => ([
  // darwin only (must be filtered for other platforms)
  applicationMenu,
  projectsMenu,
  editMenu,
  viewMenu(settings),
  // goMenu,
  windowMenu
  // helpMenu
])

export const buildFromTemplate = settings =>
  // filter null entries (darwin only):
  Menu.buildFromTemplate(template(settings).filter(x => x))

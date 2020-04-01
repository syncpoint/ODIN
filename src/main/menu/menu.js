import { Menu } from 'electron'
import applicationMenu from './application-menu'
import projectsMenu from './projects-menu'
import viewMenu from './view-menu'
import windowMenu from './window-menu'
import editMenu from './edit-menu'
import languageMenu from './language-menu'
// import helpMenu from './help-menu'
// import goMenu from './go-menu'


const template = (i18n) => ([
  // darwin only (must be filtered for other platforms)
  applicationMenu(i18n),
  projectsMenu(i18n),
  editMenu(i18n),
  viewMenu(i18n),
  // goMenu,
  windowMenu(i18n),
  languageMenu(i18n)
  // helpMenu
])

export const buildFromTemplate = (i18n) =>
  // filter null entries (darwin only):
  Menu.buildFromTemplate(template(i18n).filter(x => x))

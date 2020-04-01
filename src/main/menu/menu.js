import { Menu } from 'electron'
import applicationMenu from './application-menu'
import projectsMenu from './projects-menu'
import viewMenu from './view-menu'
import windowMenu from './window-menu'
import editMenu from './edit-menu'
import languageMenu from './language-menu'
// import helpMenu from './help-menu'
// import goMenu from './go-menu'


const template = (settings, i18n) => ([
  // darwin only (must be filtered for other platforms)
  applicationMenu,
  projectsMenu(i18n),
  editMenu,
  viewMenu(settings),
  // goMenu,
  windowMenu,
  languageMenu(i18n)
  // helpMenu
])

export const buildFromTemplate = (settings, i18n) =>
  // filter null entries (darwin only):
  Menu.buildFromTemplate(template(settings, i18n).filter(x => x))

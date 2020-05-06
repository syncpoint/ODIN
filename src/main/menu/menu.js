import { Menu } from 'electron'
import applicationMenu from './application-menu'
import managementMenu from './management-menu'
import viewMenu from './view-menu'
import windowMenu from './window-menu'
import editMenu from './edit-menu'
import languageMenu from './language-menu'
// import helpMenu from './help-menu'
// import goMenu from './go-menu'

let oldArgs = {}
const template = (i18n, args) => ([
  // darwin only (must be filtered for other platforms)
  applicationMenu(i18n),
  managementMenu(i18n),
  editMenu(i18n),
  viewMenu(i18n, args),
  // goMenu,
  windowMenu(i18n),
  languageMenu(i18n)
  // helpMenu
])

export const buildFromTemplate = (i18n, args = {}) => {
  // filter null entries (darwin only):
  oldArgs = { ...oldArgs, ...args }
  return Menu.buildFromTemplate(template(i18n, oldArgs).filter(x => x))

}

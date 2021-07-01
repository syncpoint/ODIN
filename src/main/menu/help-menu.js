const menu = i18n => (
  {
    label: i18n.t('help.name'),
    submenu: [
      {
        label: i18n.t('help.onlineUserManual'),
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://syncpoint.github.io/odin-manual')
        }
      }
    ]
  }
)

export default menu

const menu = i18n => (
  {
    label: i18n.t('help.name'),
    submenu: [
      {
        label: i18n.t('help.onlineUserManual'),
        click: async () => {
          const { shell } = require('electron')
          const languagePostfix = i18n.language === 'en' ? 'index.en' : ''
          await shell.openExternal(`https://www.syncpoint.io/odin-manual/${languagePostfix}`)
        }
      }
    ]
  }
)

export default menu

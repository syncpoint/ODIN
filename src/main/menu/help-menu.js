import { shell } from 'electron'

const menu = i18n => (
  {
    label: i18n.t('help.name'),
    submenu: [
      {
        label: i18n.t('help.onlineUserManual'),
        click: async () => {
          const languagePostfix = i18n.language === 'en' ? 'index.en' : ''
          await shell.openExternal(`https://syncpoint.github.io/odin-manual/${languagePostfix}`)
        }
      },
      {
        label: i18n.t('help.onlineSupportSlack'),
        click: async () => {
          await shell.openExternal('https://join.slack.com/t/odin-c2is/shared_invite/zt-ttboh2l0-0r92XQC___tTQEG1Ku1spA')
        }
      },
      {
        label: i18n.t('help.onlineSupportEMail'),
        click: async () => {
          await shell.openExternal('mailto:odin-support@syncpoint.io?subject=ODIN support')
        }
      }
    ]
  }
)

export default menu

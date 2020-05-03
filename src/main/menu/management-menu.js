
const menu = i18n => ({
  label: i18n.t('management.name'),
  submenu: [
    {
      label: i18n.t('management.projects'),
      accelerator: 'CmdOrCtrl+Alt+M',
      click: (menuItem, browserWindow) => {
        /* browserWindow is undefined if minimized or closed */
        if (browserWindow) browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
      }
    },
    {
      label: i18n.t('management.basemaps'),
      accelerator: 'CmdOrCtrl+Alt+B',
      click: (menuItem, browserWindow) => {
        /* browserWindow is undefined if minimized or closed */
        if (browserWindow) browserWindow.send('IPC_SHOW_BASEMAP_MANAGEMENT')
      }
    }
  ]
})

export default menu

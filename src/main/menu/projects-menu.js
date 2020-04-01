
const menu = i18n => ({
  label: i18n.t('Projects'),
  submenu: [
    {
      label: i18n.t('Manage Projects'),
      accelerator: 'CmdOrCtrl+Alt+M',
      click: (menuItem, browserWindow) => {
        /* browserWindow is undefined if minimized or closed */
        if (browserWindow) browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
      }
    }
  ]
})

export default menu

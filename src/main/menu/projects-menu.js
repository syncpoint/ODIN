
const menu = {
  label: 'Projects',
  submenu: [
    {
      label: 'Manage Projects...',
      accelerator: 'CmdOrCtrl+Alt+M',
      click: (menuItem, browserWindow) => browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
    }
  ]
}

export default menu

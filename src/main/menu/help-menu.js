export default {
  role: 'help',
  submenu: [
    {
      label: 'Learn More',
      click () { require('electron').shell.openExternal('https://electronjs.org') }
    }
  ]
}

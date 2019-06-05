const menu = {
  role: 'window',
  submenu: [
    { role: 'minimize' },
    { role: 'close' }
  ]
}

if (process.platform === 'darwin') {
  menu.submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    { role: 'front' }
  ]
}

export default menu

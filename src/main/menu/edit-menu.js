const menu = {
  label: 'Edit',
  submenu: [
    {
      label: 'Undo',
      accelerator: 'CmdOrCtrl+Z',
      click: (_, browserWindow) => {
        browserWindow.webContents.undo()
        if (browserWindow) browserWindow.send('IPC_EDIT_UNDO')
      }
    },
    {
      label: 'Redo',
      accelerator: 'CmdOrCtrl+Shift+Z',
      click: (_, browserWindow) => {
        browserWindow.webContents.redo()
        if (browserWindow) browserWindow.send('IPC_EDIT_REDO')
      }
    },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'pasteandmatchstyle' },
    { role: 'delete' },
    {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      click: (_, browserWindow) => {
        if (!browserWindow) return
        browserWindow.webContents.selectAll()
        browserWindow.send('IPC_EDIT_SELECT_ALL')
      }
    }

    // darwin: automatically added:
    // 1. separator (see below)
    // 2. start dictation
    // 3. emojis & symbols
  ]
}

if (process.platform === 'darwin') {
  menu.submenu.push({ type: 'separator' })
}

export default menu

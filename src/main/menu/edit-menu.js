
const onclick = fn => (_, browserWindow) => {
  if (browserWindow) fn(browserWindow)
}

const menu = i18n => {
  const m = {
    label: i18n.t('edit.name'),
    submenu: [
      {
        label: i18n.t('edit.undo'),
        accelerator: 'CmdOrCtrl+Z',
        click: onclick(browserWindow => {
          browserWindow.webContents.send('IPC_EDIT_UNDO')
          browserWindow.webContents.undo()
        })
      },
      {
        label: i18n.t('edit.redo'),
        accelerator: 'CmdOrCtrl+Shift+Z',
        click: onclick(browserWindow => {
          browserWindow.webContents.send('IPC_EDIT_REDO')
          browserWindow.webContents.redo()
        })
      },
      { type: 'separator' },
      {
        role: 'cut',
        label: i18n.t('edit.cut')
      },
      {
        role: 'copy',
        label: i18n.t('edit.copy')
      },
      {
        role: 'paste',
        label: i18n.t('edit.paste')
      },
      {
        label: i18n.t('edit.selectAll'),
        accelerator: 'CmdOrCtrl+A',
        click: onclick(browserWindow => {
          // browserWindow.webContents.selectAll()
          browserWindow.webContents.send('IPC_EDIT_SELECT_ALL')
        })
      }
      ,
      {
        role: 'copy coordinate',
        label: i18n.t('edit.copycoordinate'),
        accelerator: 'CmdOrCtrl+D',
        click: onclick(browserWindow => {
          browserWindow.webContents.send('IPC_EDIT_COPY_COORDINATE')
        })
      }
    ]
  }

  // darwin: automatically added:
  // 1. separator (see below)
  // 2. start dictation
  // 3. emojis & symbols
  if (process.platform === 'darwin') m.submenu.push({ type: 'separator' })
  return m
}

export default menu

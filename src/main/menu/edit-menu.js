
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
          browserWindow.webContents.undo()
          browserWindow.send('IPC_EDIT_UNDO')
        })
      },
      {
        label: i18n.t('edit.redo'),
        accelerator: 'CmdOrCtrl+Shift+Z',
        click: onclick(browserWindow => {
          browserWindow.webContents.redo()
          browserWindow.send('IPC_EDIT_REDO')
        })
      },
      { type: 'separator' },
      {
        label: i18n.t('edit.cut'),
        accelerator: 'CmdOrCtrl+X',
        click: onclick(browserWindow => {
          browserWindow.webContents.cut()
          browserWindow.send('IPC_EDIT_CUT')
        })
      },
      {
        label: i18n.t('edit.copy'),
        accelerator: 'CmdOrCtrl+C',
        click: onclick(browserWindow => {
          browserWindow.webContents.copy()
          browserWindow.send('IPC_EDIT_COPY')
        })
      },
      {
        label: i18n.t('edit.paste'),
        accelerator: 'CmdOrCtrl+V',
        click: onclick(browserWindow => {
          browserWindow.webContents.paste()
          browserWindow.send('IPC_EDIT_PASTE')
        })
      },
      {
        role: 'pasteandmatchstyle', label: i18n.t('edit.pasteAndMatchStyle')
      },
      {
        label: i18n.t('edit.delete'),
        click: onclick(browserWindow => {
          browserWindow.webContents.delete()
          browserWindow.send('IPC_EDIT_DELETE')
        })
      },
      {
        label: i18n.t('edit.selectAll'),
        accelerator: 'CmdOrCtrl+A',
        click: onclick(browserWindow => {
          browserWindow.send('IPC_EDIT_SELECT_ALL')
        })
      }

    // darwin: automatically added:
    // 1. separator (see below)
    // 2. start dictation
    // 3. emojis & symbols
    ]
  }

  if (process.platform === 'darwin') m.submenu.push({ type: 'separator' })
  return m
}

export default menu

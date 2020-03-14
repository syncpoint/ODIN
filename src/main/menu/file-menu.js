import { createProject, openProject, saveProject } from '../projects'

const menu = {
  label: 'File',
  submenu: [
    {
      label: 'New Project',
      accelerator: 'Shift+CmdOrCtrl+N',
      click: () => createProject()
    },
    {
      label: 'Open Project...',
      accelerator: 'CmdOrCtrl+O',
      click: (menuItem, browserWindow, event) => openProject(browserWindow)
    },
    {
      label: 'Save As...',
      accelerator: 'Shift+CmdOrCtrl+S',
      click: () => saveProject()
    }
  ]
}

if (process.platform !== 'darwin') {
  menu.submenu.push({ type: 'separator' })
  menu.submenu.push({ role: 'quit' })
}

export default menu

import { createProject, openProject, saveProject } from '../projects'
import { clearRecentProjects } from '../recentProjects'

const projectToMenuItem = projects => {
  if (!projects) return []
  return projects.map(project => ({
    label: project
  }))
}

const buildRecentProjectsSubmenu = settings => {
  const entries = projectToMenuItem(settings.get('recentProjects'))
  if (entries && entries.length > 0) {
    entries.push({ type: 'separator' })
    entries.push({
      label: 'Clear Recently Opened',
      click: clearRecentProjects
    })
  }
  return entries
}

const menu = settings => ({
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
      label: 'Open Recent Projects...',
      submenu: buildRecentProjectsSubmenu(settings)
    },
    {
      label: 'Save As...',
      accelerator: 'Shift+CmdOrCtrl+S',
      click: () => saveProject()
    }
  ]
})

if (process.platform !== 'darwin') {
  menu.submenu.push({ type: 'separator' })
  menu.submenu.push({ role: 'quit' })
}

export default menu

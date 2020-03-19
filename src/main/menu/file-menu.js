import projects from '../projects'

const buildRecentProjectsSubmenu = () => {

  const entries = projects.recentProjects().map(project => ({
    label: project,
    click: (menuItem, browserWindow, event) => projects.openProject(browserWindow, project)
  }))

  if (entries && entries.length > 0) {
    entries.push({ type: 'separator' })
    entries.push({
      label: 'Clear Recently Opened',
      click: projects.clearRecentProjects
    })
  }

  return entries
}

const menu = () => {
  const menu = {
    label: 'File',
    submenu: [
      {
        label: 'Open Recent Projects...',
        submenu: buildRecentProjectsSubmenu()
      }
    ]
  }

  if (process.platform !== 'darwin') {
    menu.submenu.push({ type: 'separator' })
    menu.submenu.push({ role: 'quit' })
  }

  return menu
}


export default menu

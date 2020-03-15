import settings from 'electron-settings'

const RECENT_PROJECTS = 'recentProjects'
const MAX_ENTRIES = 5

// TODO: move to projects.js
export const addRecentProject = project => {
  let recentProjects = settings.get(RECENT_PROJECTS)
  if (!recentProjects) recentProjects = []

  // no duplicate entries allowed
  if (recentProjects.includes(project)) return

  recentProjects.unshift(project)
  recentProjects = recentProjects.slice(0, MAX_ENTRIES)
  settings.set(RECENT_PROJECTS, recentProjects)
}

export const clearRecentProjects = () => {
  settings.set(RECENT_PROJECTS, [])
}

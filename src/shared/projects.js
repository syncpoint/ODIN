import path from 'path'
import fs from 'fs'
import uuid from 'uuid-random'

/*  since this module is shared and may be uses both in the main and in the
    renderer process we must import both in order to resolve the HOME path
*/
import { app, remote } from 'electron'

const HOME = remote ? remote.app.getPath('home') : app.getPath('home')
const ODIN_HOME = path.join(HOME, 'ODIN')
const ODIN_PROJECTS = path.join(ODIN_HOME, 'projects')
const ODIN_LAYERS = 'layers'

const exists = projectPath => fs.existsSync(projectPath)

const createProject = async (name) => {
  const projectPath = path.join(ODIN_PROJECTS, name)
  if (exists(projectPath)) return
  /* create subfolder structure, too */
  await fs.promises.mkdir(path.join(projectPath, ODIN_LAYERS), { recursive: true })
  return projectPath
}

const enumerateProjects = async () => {
  const enumerateDirectoryEntries = fs.promises.readdir(ODIN_PROJECTS, { withFileTypes: true })
  const foldersOnly = dirEntries => dirEntries.filter(dirEntry => dirEntry.isDirectory())
  const extractNames = dirEntries => dirEntries.map(entry => entry.name)
  return enumerateDirectoryEntries
    .then(foldersOnly)
    .then(extractNames)
}

export default {
  exists,
  createProject,
  brandNew: () => uuid(),
  enumerateProjects
}

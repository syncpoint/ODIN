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
const ODIN_METADATA = 'metadata.json'
const ODIN_PREVIEW = 'preview.jpg'
const ODIN_DEFAULT_METADATA = {
  name: 'untitled project'
}

const exists = projectPath => fs.existsSync(projectPath)

const createProject = async (name = uuid()) => {
  const projectPath = path.join(ODIN_PROJECTS, name)
  if (exists(projectPath)) return
  /* create subfolder structure, too */
  await fs.promises.mkdir(path.join(projectPath, ODIN_LAYERS), { recursive: true })
  await fs.promises.writeFile(path.join(projectPath, ODIN_METADATA), JSON.stringify(ODIN_DEFAULT_METADATA))
  return projectPath
}

const deleteProject = async (projectPath) => {
  if (!exists(projectPath)) return
  try {
    /* TODO: option recursive is flagged as EXPERIMENTAL in v12 LTS */
    return fs.promises.rmdir(projectPath, { recursive: true })
  } catch (error) {
    console.dir(error)
  }
}

const enumerateProjects = async () => {
  const enumerateDirectoryEntries = fs.promises.readdir(ODIN_PROJECTS, { withFileTypes: true })
  const foldersOnly = dirEntries => dirEntries.filter(dirEntry => dirEntry.isDirectory())
  const constructPath = dirEntries => dirEntries.map(entry => path.join(ODIN_PROJECTS, entry.name))
  return enumerateDirectoryEntries
    .then(foldersOnly)
    .then(constructPath)
}

const readMetadata = async (projectPath) => {
  if (!exists(projectPath)) return { path: projectPath, metadata: ODIN_DEFAULT_METADATA }
  try {
    const content = await fs.promises.readFile(path.join(projectPath, ODIN_METADATA))
    const metadata = JSON.parse(content)
    return {
      path: projectPath,
      metadata
    }
  } catch (error) {
    console.error(error)
    return { path: projectPath, metadata: ODIN_DEFAULT_METADATA, error: error.message }
  }
}

const writeMetadata = async (projectPath, metadata) => {
  if (!exists(projectPath)) {
    console.error(`project path does not exist ${projectPath}`)
    return
  }
  try {
    const content = JSON.stringify(metadata)
    await fs.promises.writeFile(path.join(projectPath, ODIN_METADATA), content)
  } catch (error) {
    console.error(error)
  }
}

const readPreview = async (projectPath, options = { encoding: 'base64' }) => {
  if (!exists(projectPath)) {
    console.error(`project path does not exist ${projectPath}`)
    return
  }
  try {
    return await fs.promises.readFile(path.join(projectPath, ODIN_PREVIEW), options)
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(error)
  }
}

const writePreview = async (projectPath, jpgImageBuffer) => {
  if (!exists(projectPath)) {
    console.error(`project path does not exist ${projectPath}`)
    return
  }
  try {
    await fs.promises.writeFile(path.join(projectPath, ODIN_PREVIEW), jpgImageBuffer)
  } catch (error) {
    console.error(error)
  }
}

export default {
  exists,
  createProject,
  deleteProject,
  enumerateProjects,
  readMetadata,
  writeMetadata,
  readPreview,
  writePreview
}

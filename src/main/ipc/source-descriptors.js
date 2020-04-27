import fs from 'fs'
import path from 'path'
import uuid from 'uuid-random'
import { app, ipcMain } from 'electron'

const HOME = app.getPath('home')
const ODIN_HOME = path.join(HOME, 'ODIN')
const ODIN_SOURCES = path.join(ODIN_HOME, 'sources.json')

const listSourceDescriptors = async () => {
  if (!fs.existsSync(ODIN_SOURCES)) return []

  const sources = JSON.parse(await fs.promises.readFile(ODIN_SOURCES, 'utf-8'))
  return sources
}

ipcMain.handle('IPC_LIST_SOURCE_DESCRIPTORS', async () => {
  return await listSourceDescriptors()
})

ipcMain.handle('IPC_PERSIST_DESCRIPTOR', async (event, descriptor) => {
  console.log('persisting descriptor')
  console.dir(descriptor)
  const sources = await listSourceDescriptors()

  if (descriptor.id) {
    // existing
    const index = sources.findIndex(source => source.id === descriptor.id)
    sources[index] = descriptor
  } else {
    // new
    descriptor.id = uuid()
    sources.push(descriptor)
  }

  console.dir(sources)
  await fs.promises.writeFile(ODIN_SOURCES, JSON.stringify(sources))
})

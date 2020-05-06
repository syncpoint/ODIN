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

ipcMain.handle('IPC_UPSERT_DESCRIPTOR', async (event, descriptor) => {
  if (!descriptor) return
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
  await fs.promises.writeFile(ODIN_SOURCES, JSON.stringify(sources))
  event.sender.send('IPC_SOURCE_DESCRIPTORS_CHANGED', sources)
})

ipcMain.handle('IPC_DELETE_DESCRIPTOR', async (event, descriptor) => {
  if (!descriptor) return
  const sources = await listSourceDescriptors()
  const reducedSources = sources.filter(source => source.id !== descriptor.id)

  await fs.promises.writeFile(ODIN_SOURCES, JSON.stringify(reducedSources))
  event.sender.send('IPC_SOURCE_DESCRIPTORS_CHANGED', reducedSources)
})

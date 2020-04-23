import fs from 'fs'
import path from 'path'
import { app, ipcMain } from 'electron'

const HOME = app.getPath('home')
const ODIN_HOME = path.join(HOME, 'ODIN')
const ODIN_SOURCES = path.join(ODIN_HOME, 'sources.json')

const listSources = async () => {
  if (!fs.existsSync(ODIN_SOURCES)) return []

  const sources = JSON.parse(await fs.promises.readFile(ODIN_SOURCES, 'utf-8'))
  return sources
}

ipcMain.handle('IPC_LIST_SOURCES', async () => {
  return await listSources()
})

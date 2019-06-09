import fs from 'fs'
import path from 'path'
import { remote } from 'electron'
import store from '../../stores/layer-store'

export const COMMAND_IMPORT_LAYER = () => () => {
  const filters = [
    { name: 'Layers', extensions: ['json'] },
    { name: 'All Files', extensions: ['*'] }
  ]

  remote.dialog.showOpenDialog({
    filters,
    properties: ['openFile', 'multiSelections']
  }).forEach(filename => {
    try {
      const json = JSON.parse(fs.readFileSync(filename))
      if (json.type === 'FeatureCollection') {
        const basename = path.basename(filename, '.json')
        store.add(basename, json)
      }
    } catch (err) {
      console.error(err)
    }
  })
}

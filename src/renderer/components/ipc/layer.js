import fs from 'fs'
import path from 'path'
import { remote } from 'electron'
import evented from '../../evented'
import store from '../../stores/layer-store'

const importFile = filename => {
  try {
    const json = JSON.parse(fs.readFileSync(filename))
    if (json.type === 'FeatureCollection') {
      const basename = path.basename(filename, '.json')
      store.add(basename, json)
    }
  } catch (err) {
    console.error(err)
  }
}

export const COMMAND_IMPORT_LAYER = ({ map }) => {

  return () => {
    const filters = [
      { name: 'Layers', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]

    const filenames = remote.dialog.showOpenDialog({
      filters,
      properties: ['openFile', 'multiSelections']
    })

    if (filenames) filenames.forEach(importFile)
  }
}

evented.on('MAP_CREATED', map => {
  map._container.ondragover = () => false
  map._container.ondragleave = () => false
  map._container.ondragend = () => false

  map._container.ondrop = event => {
    event.preventDefault()

    // Extract file paths and notify main process:
    const filenames = []
    for (let file of event.dataTransfer.files) filenames.push(file.path)
    filenames.forEach(importFile)
    return false
  }
})

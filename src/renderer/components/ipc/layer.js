import fs from 'fs'
import path from 'path'
import { remote } from 'electron'
import uuid from 'uuid-random'
import evented from '../../evented'
import store from '../../stores/layer-store'

const featureCollection = filename => new Promise((resolve, reject) => {
  fs.readFile(filename, (err, data) => {
    if (err) return reject(err)
    resolve(JSON.parse(data.toString()))
  })
})

const importFile = filename => featureCollection(filename).then(collection => {
  if (collection.type !== 'FeatureCollection') return
  const basename = path.basename(filename, '.json')
  const layerId = uuid()
  store.addLayer(layerId, basename)
  collection.features.forEach(feature => store.addFeature(layerId)(uuid(), feature))
  return [layerId, collection]
})

const importFiles = filenames => {
  Promise.all(filenames.map(importFile)).then(layers => {
    const [layerId, collection] = layers[layers.length - 1]
    if (collection.bbox) store.updateBounds(layerId, collection.bbox)
  })
}

export const COMMAND_IMPORT_LAYER = () => () => {
  const filters = [
    { name: 'Layers', extensions: ['json'] },
    { name: 'All Files', extensions: ['*'] }
  ]

  remote.dialog.showOpenDialog({
    filters,
    properties: ['openFile', 'multiSelections']
  }, filenames => {
    if (filenames) filenames.forEach(importFile)
  })
}

export const COMMAND_EXPORT_DEFAULT_LAYER = () => () => {
  const filters = [
    { name: 'Layers', extensions: ['json'] },
    { name: 'All Files', extensions: ['*'] }
  ]

  remote.dialog.showSaveDialog({ filters }, filePath => {

    // For now, default layer only:
    const features = Object.entries(store.layer('0').features).map(([_, feature]) => feature)
    const layer = {
      type: 'FeatureCollection',
      features: features
    }

    fs.writeFile(filePath, JSON.stringify(layer), err => {
      if (err) evented.emit('OSD_MESSAGE', { message: err.message, duration: 5000 })
    })
  })
}

// Hook-in drag and drop capabilities:
evented.on('MAP_CREATED', map => {
  map._container.ondragover = () => false
  map._container.ondragleave = () => false
  map._container.ondragend = () => false

  map._container.ondrop = event => {
    event.preventDefault()

    // Extract file paths and notify main process:
    const filenames = []
    for (let file of event.dataTransfer.files) filenames.push(file.path)
    importFiles(filenames)
    return false
  }
})

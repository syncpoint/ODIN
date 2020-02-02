import fs from 'fs'
import path from 'path'
import { remote } from 'electron'
import uuid from 'uuid-random'
import store from '../stores/layer-store'
import evented from '../evented'

/**
 * Read GeoJSON feature collection from file.
 */
const featureCollection = filename => new Promise((resolve, reject) => {
  fs.readFile(filename, (err, data) => {
    if (err) return reject(err)
    resolve(JSON.parse(data.toString()))
  })
})

/**
 * Import GeoJSON layer from file.
 */
const importFile = filename => featureCollection(filename).then(collection => {
  if (collection.type !== 'FeatureCollection') return
  const basename = path.basename(filename, '.json')
  const layerId = uuid()
  store.addLayer(layerId, basename)
  collection.features.forEach(feature => store.addFeature(layerId)(uuid(), feature))
  return [layerId, collection]
})

/**
 * Import multiple GeoJSON layers.
 */
export const importLayers = filenames => {
  Promise.all(filenames.map(importFile)).then(layers => {
    if (layers.length === 0) return
    const [layerId, collection] = layers[layers.length - 1]
    if (collection.bbox) store.updateBounds(layerId, collection.bbox)
  })
}

const filters = [
  { name: 'Layers', extensions: ['json'] },
  { name: 'All Files', extensions: ['*'] }
]

const promptOpenMultiple = () => remote.dialog.showOpenDialogSync({
  filters,
  properties: ['openFile', 'multiSelections']
})

const promptSaveSingle = layerId => {
  const defaultPath = `${store.layer(layerId).name || layerId}.json`
  return remote.dialog.showSaveDialogSync({ filters, defaultPath })
}

export const importLayersPrompt = async () => {
  const filenames = promptOpenMultiple()
  console.log('[importLayers]', filenames)
  importLayers(filenames)
}

export const exportLayerPrompt = layerId => {
  const filename = promptSaveSingle(layerId)
  const features = Object.entries(store.layer(layerId).features).map(([_, feature]) => feature)
  const layer = {
    type: 'FeatureCollection',
    features: features
  }

  fs.writeFile(filename, JSON.stringify(layer), err => {
    if (err) evented.emit('OSD_MESSAGE', { message: err.message, duration: 5000 })
  })
}

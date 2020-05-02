import { remote } from 'electron'
import path from 'path'
import fs from 'fs'
import uuid from 'uuid-random'
import { GeoJSON } from 'ol/format'
import Feature from 'ol/Feature'

import undo from '../undo'
import { K, uniq, noop } from '../../shared/combinators'

const projectPath = () => remote.getCurrentWindow().path

const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

let reducers = []

const emit = event =>
  reducers.forEach(reducer => setImmediate(() => reducer(event)))

const filenameList = {}

/**
 * Read (absolute) layer file names from open project.
 */
const layerFiles = () => {
  const dir = path.join(projectPath(), 'layers')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(filename => filename.endsWith('.json'))
    .map(filename => path.join(dir, filename))
}

/**
 *
 */
const loadFeatures = async (id, filename) => {
  const contents = await fs.promises.readFile(filename, 'utf8')
  return geoJSON.readFeatures(contents).map(feature => {
    feature.setId(`feature:${id}/${uuid()}`)
    feature.set('layerId', `layer:${id}`)
    return feature
  })
}

/**
 * writeFeatures :: a (ol/Feature | featureId | layerId) => [a] -> unit
 */
const writeFeatures = xs => {
  const layerId = s => `layer:${s.match(/feature:(.*)\/.*/)[1]}`
  const layerIds = xs
    .map(x => x instanceof Feature ? x.get('layerId') : x)
    .map(s => s.startsWith('feature:') ? layerId(s) : s)
    .filter(uniq)

  layerIds.forEach(layerId => {
    const filename = filenameList[layerId]
    const features = Object.values(featureList)
      .filter(feature => feature.get('layerId') === layerId)
    fs.writeFile(filename, geoJSON.writeFeatures(features), noop)
  })
}

/**
 * features :: string ~> ol/Feature
 *
 * NOTE: We choose to store ol/Feature instead of object/JSON
 * for a number of reasons.
 *   - support for cloning of features and geometries
 *   - features are directly shared (mostly R/O) with views
 *   - Web-Mercator projection is used throughout the model
 */
const featureList = {}

/**
 * Load layers from project.
 */
;(() => layerFiles().forEach(async filename => {
  const id = uuid()
  filenameList[`layer:${id}`] = filename

  const additions = await loadFeatures(id, filename)
  additions.forEach(feature => (featureList[feature.getId()] = feature))
  emit({ type: 'featuresadded', features: additions, selected: false })
}))()


const register = reducer => {
  reducers = [...reducers, reducer]
  setImmediate(() => reducer({ type: 'snapshot', filenames: filenameList, features: featureList }))
}

const deregister = reducer => {
  reducers = reducers.filter(x => x !== reducer)
}

/**
 * insertFeaturesCommand :: [ol/Feature] -> command
 * Add given features to corresponding input layer.
 */
const insertFeaturesCommand = clones => {
  const featureId = s => `feature:${s.match(/layer:(.*)/)[1]}/${uuid()}`
  const additions = clones.map(feature => {
    // TODO: insert into active layer
    feature.setId(featureId(feature.get('layerId')))
    return feature
  })

  return {
    inverse: () => deleteFeaturesCommand(additions.map(feature => feature.getId())),
    apply: () => {
      additions.forEach(feature => (featureList[feature.getId()] = feature))
      emit({ type: 'featuresadded', features: additions, selected: true })
      writeFeatures(additions)
    }
  }
}

/**
 * deleteFeaturesCommand :: [string] -> command
 * Delete features with given ids.
 */
const deleteFeaturesCommand = featureIds => {

  // Create clones (without ids) to re-insert if necessary.
  const clones = featureIds
    .map(id => featureList[id])
    .map(feature => feature.clone())

  return {
    inverse: () => insertFeaturesCommand(clones),
    apply: () => {
      featureIds.forEach(id => delete featureList[id])
      emit({ type: 'featuresremoved', ids: featureIds })
      writeFeatures(featureIds)
    }
  }
}

/**
 * updateGeometriesCommand
 *   :: (string ~> ol/Geometry) -> (string ~> ol/Geometry) -> command
 */
const updateGeometriesCommand = (initial, current) => ({
  inverse: () => updateGeometriesCommand(current, initial),
  apply: () => {
    const features = Object.entries(initial)
      .map(([id, geometry]) => [featureList[id], geometry])
      .map(([feature, geometry]) => K(feature)(feature => (feature.setGeometry(geometry))))

    writeFeatures(features)
  }
})

/**
 * removeFeatures :: [string] -> unit
 */
const removeFeatures = featureIds => {
  const command = deleteFeaturesCommand(featureIds)
  command.apply()
  undo.push(command.inverse())
}

/**
 * addFeatures :: [[string, string]] -> unit
 */
const addFeatures = content => {
  // TODO: use active layer
  const readFeature = ([layerUri, json]) => geoJSON.readFeature(json)
  const clones = content.map(readFeature)
  const command = insertFeaturesCommand(clones)
  command.apply()
  undo.push(command.inverse())
}

/**
 * updateGeometries :: ([string, ol/geom/Geometry]) -> [ol/Feature] -> unit
 * Push undoable command to revert geometries AFTER the effect.
 */
const updateGeometries = (initial, features) => {
  const current = features
    .map(feature => [feature.getId(), feature.getGeometry().clone()])
    .reduce((acc, [id, geometry]) => K(acc)(acc => (acc[id] = geometry)), {})

  // NOTE: No need to apply; geometries are already up to date.
  const command = updateGeometriesCommand(initial, current)
  undo.push(command)
  writeFeatures(features)
}

export default {
  register,
  deregister,
  removeFeatures,
  addFeatures,
  updateGeometries
}

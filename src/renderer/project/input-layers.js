import { remote } from 'electron'
import path from 'path'
import fs from 'fs'
import { GeoJSON } from 'ol/format'
import * as ol from 'ol'

import { K, uniq, noop } from '../../shared/combinators'
import undo from '../undo'
import Feature from './Feature'
import URI from './URI'
import evented from '../evented'

/**
 * Project layer/feature model.
 * Model is updated through public functions.
 * Updates are propagated as events to registered reducers.
 *
 * NOTE: Events are emitted in a pretty relaxed manner (setImmediate()).
 * I.e. event emitting is scheduled behind outstandig I/O.
 * This is probably not necessary, but we want to play nice and not
 * choke our precious thread. Reducers have to live with it.
 */


// --
// SECTION: In-memory state: layer file names and features.

const layerList = {}

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
 * layerFeatures :: string -> [ol/Feature]
 */
const layerFeatures = layerId =>
  Object.values(featureList)
    .filter(Feature.hasLayerId(layerId))

const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})


// --
// SECTION: Input layer I/O.

/**
 * loadFeatures :: (string, string) -> Promise<[ol/Feature]>
 * Load features for a layer. Features are assigned unique ids
 * and a property identifying the containing layer.
 */
const loadFeatures = async (layerId, filename) => {
  const contents = await fs.promises.readFile(filename, 'utf8')
  return geoJSON.readFeatures(contents).map(feature => {
    feature.setId(URI.featureId(layerId))
    feature.set('layerId', layerId)
    return feature
  })
}

/**
 * writeFeatures :: a (ol/Feature | featureId | layerId) => [a] -> unit
 */
const writeFeatures = xs => {
  const layerIds = xs
    .map(x => x instanceof ol.Feature ? Feature.layerId(x) : x)
    .map(s => URI.isFeatureId(s) ? URI.layerId(s) : s)
    .filter(uniq)

  layerIds.forEach(layerId => {
    const filename = layerList[layerId].filename
    const features = layerFeatures(layerId)
    fs.writeFile(filename, geoJSON.writeFeatures(features), noop)
  })
}

/**
 * reducers :: [(event) -> unit]
 */
let reducers = []

const register = reducer => {
  reducers = [...reducers, reducer]

  // Prepare layers/features snapshot for new reducer.
  // NOTE: Early bird registrations will probably miss features,
  // because they are loaded asynchronously, but 'featuresadded' event
  // will accommodate for that.
  const layers = Object.values(layerList).map(layer => {
    const features = layerFeatures(layer.id)
    return {
      ...layer,
      locked: features.some(Feature.locked),
      hidden: features.some(Feature.hidden)
    }
  })

  setImmediate(() => reducer({
    type: 'snapshot',
    layers,
    features: Object.values(featureList)
  }))
}

const deregister = reducer => (reducers = reducers.filter(x => x !== reducer))
const emit = event => reducers.forEach(reducer => setImmediate(() => reducer(event)))


// --
// SECTION: Initialization.
// NOTE: Currently, project lifecycle is bound to renderer window.

/**
 * Read (absolute) layer file names from open project.
 */
const layerFiles = () => {
  const projectPath = remote.getCurrentWindow().path
  const dir = path.join(projectPath, 'layers')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(filename => filename.endsWith('.json'))
    .map(filename => path.join(dir, filename))
}

/**
 * Load layers from project.
 */
;(() => layerFiles().forEach(async filename => {
  const layerId = URI.layerId()

  layerList[layerId] = {
    id: layerId,
    filename,
    name: path.basename(filename, '.json'),
    active: false
  }

  // Asynchronously load input layers:
  const additions = await loadFeatures(layerId, filename)
  additions.forEach(feature => (featureList[Feature.id(feature)] = feature))
  emit({ type: 'featuresadded', features: additions, selected: false })
}))()


// --
// SECTION: Public API to update state.

/**
 * insertFeaturesCommand :: [ol/Feature] -> command
 * Add given features to corresponding input layer.
 */
const insertFeaturesCommand = clones => {
  const additions = clones.map(feature => {
    const layerId = Feature.layerId(feature)
    feature.setId(URI.featureId(layerId))
    return feature
  })

  return {
    inverse: () => deleteFeaturesCommand(additions.map(feature => Feature.id(feature))),
    apply: () => {
      additions.forEach(feature => (featureList[Feature.id(feature)] = feature))
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
  const readFeature = ([layerId, json]) => {
    const feature = geoJSON.readFeature(json)
    feature.set('layerId', layerId)
    return feature
  }

  const additions = content.map(readFeature)
  const command = insertFeaturesCommand(additions)
  command.apply()
  undo.push(command.inverse())
}

/**
 * updateGeometries :: ([string, ol/geom/Geometry]) -> [ol/Feature] -> unit
 * Push undoable command to revert geometries AFTER the effect.
 */
const updateGeometries = (initial, features) => {
  const current = features
    .map(feature => [Feature.id(feature), Feature.cloneGeometry(feature)])
    .reduce((acc, [id, geometry]) => K(acc)(acc => (acc[id] = geometry)), {})

  // NOTE: No need to apply; geometries are already up to date.
  const command = updateGeometriesCommand(initial, current)
  undo.push(command)
  writeFeatures(features)
}

/**
 * toggleLayerLock :: string -> unit
 * Lock/unlock layer.
 * NOTE: Lock state is stored in features:
 * One locked feature locks layer.
 */
const toggleLayerLock = layerId => {
  const features = layerFeatures(layerId)
  const locked = features.some(Feature.locked)
  const toggle = locked ? Feature.unlock : Feature.lock
  features.forEach(toggle)
  if (!locked) deactivateLayer(layerId)
  writeFeatures(features)
  emit({ type: 'layerlocked', layerId, locked: !locked })
}

/**
 * toggleLayerShow :: string -> unit
 * Hide/show layer.
 * NOTE: Hidden state is stored in features:
 * One hidden feature hides layer.
 */
const toggleLayerShow = layerId => {
  const features = layerFeatures(layerId)
  const hidden = features.some(Feature.hidden)
  const toggle = hidden ? Feature.unhide : Feature.hide
  features.forEach(toggle)
  if (!hidden) deactivateLayer(layerId)
  writeFeatures(features)
  emit({ type: 'layerhidden', layerId, hidden: !hidden })
}

const activateLayer = layerId => {

  // Ignore if layer is hidden or locked.
  const features = layerFeatures(layerId)
  const hidden = features.some(Feature.hidden)
  const locked = features.some(Feature.locked)
  if (hidden || locked) return

  Object.values(layerList).forEach(layer => (layer.active = false))
  layerList[layerId].active = true
  emit({ type: 'layeractivated', layerId })
  evented.emit('OSD_MESSAGE', { message: layerList[layerId].name, slot: 'A2' })
}

const deactivateLayer = layerId => {
  delete layerList[layerId].active
  emit({ type: 'layerdeactivated', layerId })
  evented.emit('OSD_MESSAGE', { message: '', slot: 'A2' })
}

export default {
  register,
  deregister,
  removeFeatures,
  addFeatures,
  updateGeometries,
  toggleLayerLock,
  toggleLayerShow,
  activateLayer,
  deactivateLayer
}

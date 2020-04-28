import fs from 'fs'
import path from 'path'
import uuid from 'uuid-random'
import { ipcRenderer } from 'electron'
import Mousetrap from 'mousetrap'
import * as R from 'ramda'

import Collection from 'ol/Collection'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { GeoJSON } from 'ol/format'
import Feature from 'ol/Feature'
import { fromLonLat } from 'ol/proj'
import { Select, Modify, Translate, DragBox } from 'ol/interaction'
import { click, primaryAction, platformModifierKeyOnly } from 'ol/events/condition'
import Style from 'ol/style/Style'

import { noop, uniq, K } from '../../shared/combinators'
import style from './style/style'
import project from '../project'
import undo from '../undo'
import selection from '../selection'
import evented from '../evented'


// --
// SECTION: Module-global (utility) functions.

/**
 * collectionArray :: (ol/Collection<a> | [a]) -> [a]
 */
const collectionArray = iterable =>
  iterable instanceof Collection
    ? iterable.getArray()
    : iterable

/**
 * geometryType :: (ol/Feature | ol/geom/Geometry) -> string
 * Map feature or feature geometry to rendered layer type.
 */
const geometryType = object => {
  const type = object instanceof Feature
    ? object.getGeometry().getType()
    : object.getType()

  switch (type) {
    case 'Point':
    case 'LineString':
    case 'Polygon': return type
    default: return 'Polygon'
  }
}

/**
 * cloneGeometries :: ol/Collection<ol/Feature> -> (string ~> ol/Geometry)
 * Map feature collection to cloned featue geometries identified by feature ids.
 */
const cloneGeometries = features =>
  collectionArray(features)
    .map(feature => [feature.getId(), feature.getGeometry().clone()])
    .reduce((acc, [id, geometry]) => K(acc)(acc => (acc[id] = geometry)), {})

/**
 * cloneFeature :: ol/Feature -> ol/Feature
 * Clone feature with 'internal properties' removed.
 * NOTE: Clone looses id from original feature.
 */
const cloneFeature = feature => K(feature.clone())(clone => {
  clone.unset('selected')
})

/**
 * layerId :: string -> string
 */
const layerId = uri =>
  uri.startsWith('layer:')
    ? uri.match(/layer:(.*)/)[1]
    : uri.match(/feature:(.*)\/.*/)[1]

/**
 * layerUri :: (ol/Feature | string) -> string
 * Map feature id (from feature or feature URI) to URI of containing layer.
 */
const layerUri = featureOrUri => {
  const featureUri = (featureOrUri instanceof Feature)
    ? featureOrUri.getId()
    : featureOrUri

  return `layer:${layerId(featureUri)}`
}

/**
 * featureId :: ol/Feature -> string
 */
const featureId = feature => feature.getId()

/**
 * assignFeatureId :: string -> ol/Feature -> ol/Feature
 */
const assignFeatureId = layerId => feature =>
  K(feature)(feature => feature.setId(`feature:${layerId}/${uuid()}`))

const assignGeometry = geometry => feature =>
  K(feature)(feature => feature.setGeometry(geometry))

const hideFeature = feature => {
  feature.set('hidden', true)
  feature.setStyle(new Style(null))
}

const unhideFeature = feature => {
  feature.unset('hidden')
  feature.setStyle(null)
}

const isFeatureHidden = feature => feature.get('hidden')
const isFeatureShowing = feature => !feature.get('hidden')
const lockFeature = feature => feature.set('locked', true)
const unlockFeature = feature => feature.unset('locked')
const isFeatureLocked = feature => feature.get('locked')
const isFeatureUnlocked = feature => !feature.get('locked')

// --
// SECTION: reduces; event targets

const reducers = []

const pushReducer = reducer => {
  reducers.push(reducer)

  // Emit snapshot if we already have some layers:
  if (Object.keys(featureCollections).length) {

    // layers :: [{string, string, boolean, boolean}]
    const layers = Object.entries(featureCollections).map(([id, featureCollection]) => {
      const features = collectionArray(featureCollection)
      const locked = features.some(isFeatureLocked)
      const hidden = features.some(isFeatureHidden)

      const featureProperties = features.map(feature => {
        const { t, v, sidc } = feature.getProperties()
        return { t, v, sidc, id: feature.getId() }
      })

      return {
        id,
        name: path.basename(featureCollection.get('filename'), '.json'),
        features: featureProperties,
        locked,
        hidden
      }
    })

    reducer({ type: 'snapshot', layers })
  }
}

const emit = event => reducers.forEach(reducer => reducer(event))


// --
// SECTION: Geometry-specific vector sources and layers.

/**
 * layers :: string ~> ol/layer/Vector
 * Geometry-specific feature vector layers with underlying sources.
 */
let layers = {}

/**
 * selectionLayer :: ol/layer/Vector
 * Layer for currently selected features (used for highlighting).
 */
let selectionLayer

/**
 * Vector source for dedicated selection layer.
 * NOTE: Created once; re-used throughout renderer lifetime.
 */
const selectionSource = new VectorSource()

/**
 * sources :: () -> [ol/source/Vector]
 * Underlying layer sources incl. selection source.
 */
const sources = () => [
  ...Object.values(layers).map(layer => layer.getSource()),
  selectionSource
]

/**
 * geometrySource :: (ol/Feature | ol/geom/Geometry) -> ol/source/Vector
 * Source for given feature or feature geometry.
 */
const geometrySource = object => layers[geometryType(object)].getSource()

/**
 * featureById :: string -> ol/Feature
 */
const featureById = id => {
  // lookup :: [ol/VectorSource] -> ol/Feature
  const lookup = ([head, ...tail]) => head
    ? head.getFeatureById(id) || lookup(tail)
    : null
  return lookup(sources())
}

/**
 * featuresById :: [string] -> [ol/Feature]
 * NOTE: Undefined entries are filtered from result.
 */
const featuresById = ids =>
  ids
    .map(featureById)
    .filter(x => x)


// --
// SECTION: Input layers as feature collections.

/**
 * featureCollections :: (string ~> ol/Collection<ol/Feature>)
 * Feature collections per input layer with layer URI as key.
 */
let featureCollections = {}

/**
 * addFeatureCollection :: [string, ol/Collection<ol/Feature>] -> unit
 */
const addFeatureCollection = ([layerUri, featureColleciton]) => {
  featureCollections[layerUri] = featureColleciton

  // Add features to corresponding source and
  // propagate feature collection updates to sources.

  const features = collectionArray(featureColleciton)
  features.forEach(feature => geometrySource(feature).addFeature(feature))

  featureColleciton.on('add', ({ element }) => geometrySource(element).addFeature(element))
  featureColleciton.on('remove', ({ element }) => {
    const source = selection.isSelected(element.getId())
      ? selectionSource
      : geometrySource(element)

    source.removeFeature(element)
    selection.deselect([element.getId()])
  })

  const locked = features.some(isFeatureLocked)
  const hidden = features.some(isFeatureHidden)

  const featureProperties = features.map(feature => {
    const { t, v, sidc } = feature.getProperties()
    return { t, v, sidc, id: feature.getId() }
  })

  emit({
    type: 'layerAdded',
    layer: {
      id: layerUri,
      name: path.basename(featureColleciton.get('filename'), '.json'),
      features: featureProperties,
      locked,
      hidden
    }
  })
}

/**
 * writeFeatureCollection :: string -> unit
 * Write originating input feature collection back to fs.
 */
const writeFeatureCollection = layerUri => {
  const features = featureCollections[layerUri]
  const clones = features.getArray().map(cloneFeature)
  const filename = features.get('filename')
  fs.writeFileSync(filename, geoJSON.writeFeatures(clones))
}

/**
 * writeFeatures :: (ol/Collection<ol/Feature> | [ol/Feature] | [string]) -> unit
 * Write underlying collections for features to fs.
 */
const writeFeatures = featuresOrUris =>
  collectionArray(featuresOrUris)
    .map(layerUri)
    .filter(uniq)
    .forEach(writeFeatureCollection)

const pushFeature = feature => featureCollections[layerUri(feature)].push(feature)
const removeFeature = feature => featureCollections[layerUri(feature)].remove(feature)


// --
// SECTION: Setup layers from project.

/**
 * GeoJSON data, by definitions, comes in WGS84;
 * OL uses Web-Mercator by default.
 */
const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

/**
 * loadFeatures :: string -> Promise<[string, ol/Collection<ol/Feature>]>
 * Load input layers as feature collection identified by (fresh) layer URI.
 */
const loadFeatures = async filename => {
  const layerId = uuid()
  const contents = await fs.promises.readFile(filename, 'utf8')

  // Use mutable ol/Collection to write current layer snapshot to file.
  const features = new Collection(geoJSON.readFeatures(contents))

  // Hide hidden features.
  collectionArray(features)
    .filter(isFeatureHidden)
    .forEach(feature => feature.setStyle(new Style(null)))

  features.set('filename', filename)
  features.forEach(assignFeatureId(layerId))
  return [`layer:${layerId}`, features]
}

/**
 * createLayers :: () -> (string ~> ol/layer/Vector)
 *
 * Setup geometry-specific layers.
 * Layer sources are downstream to input feature collections
 * and are automatically synced whenever input collection is updated.
 */
const createLayers = () => {
  const entries = ['Polygon', 'LineString', 'Point']
    .map(type => [type, new VectorSource({})])
    .map(([type, source]) => [type, new VectorLayer({ source, style })])


  // Update layer opacity depending on selection.

  const updateOpacity = () => {
    const hasSelection = selection.selected('feature:').length
    entries.forEach(([_, layer]) => layer.setOpacity(hasSelection ? 0.35 : 1))
  }

  selection.on('selected', updateOpacity)
  selection.on('deselected', updateOpacity)

  return Object.fromEntries(entries)
}


// --
// SECTION: Selection handling.
// Manage collection of selected features and feature selection state.

const selectedFeatures = new Collection()

/**
 * select :: [ol/Feature] => unit
 * Update selection without updating collection.
 */
const select = features =>
  selection.select(features.map(featureId))

/**
 * deselect :: [Feature] => unit
 * Update selection without updating collection.
 */
const deselect = features =>
  selection.deselect(features.map(featureId))

/**
 * addSelection :: [Feature] => unit
 * Update selection and add features to collection.
 */
const addSelection = features => {
  select(features)
  features.forEach(selectedFeatures.push.bind(selectedFeatures))
}

/**
 * replaceSelection :: [ol/Feature] -> unit
 */
const replaceSelection = features => {
  clearSelection()
  addSelection(features)
}

/**
 * removeSelection :: [Feature] => unit
 * Update selection and remove features from collection.
 */
const removeSelection = features => {
  deselect(features)
  features.forEach(selectedFeatures.remove.bind(selectedFeatures))
}

/**
 * clearSelection :: () => unit
 * Update selection and add clear collection.
 */
const clearSelection = () => {
  selection.deselect()
  selectedFeatures.clear()
}


/**
 * Move selected features between feature layer and selection layer.
 */

selection.on('selected', ids => {
  featuresById(ids).forEach(feature => {
    feature.set('selected', true)
    geometrySource(feature).removeFeature(feature)
    selectionSource.addFeature(feature)
  })
})

selection.on('deselected', ids => {
  featuresById(ids).forEach(feature => {
    feature.unset('selected')
    feature.setStyle(null) // release cached style, if any
    selectionSource.removeFeature(feature)
    geometrySource(feature).addFeature(feature)
  })
})


// --
// SECTION: Commands (with undo/redo support).

/**
 * updateGeometryCommand
 *   :: (string ~> ol/Geometry) -> (string ~> ol/Geometry) -> command
 */
const updateGeometryCommand = (initial, current) => ({
  inverse: () => updateGeometryCommand(current, initial),
  apply: () => {
    const features = Object.entries(initial)
      .map(([id, geometry]) => [featureById(id), geometry])
      .map(([feature, geometry]) => assignGeometry(geometry)(feature))

    // Write features/layers back to disk:
    writeFeatures(features)
  }
})

/**
 * insertFeaturesCommand :: (string ~> [ol/Feature]) -> command
 * Add given features to corresponding input layer collections.
 */
const insertFeaturesCommand = clones => {
  const features = clones
    .map(([layerUri, feature]) => [layerId(layerUri), feature])
    .map(([layerId, feature]) => assignFeatureId(layerId)(feature))

  const featureIds = features.map(featureId)

  return {
    inverse: () => deleteFeaturesCommand(featureIds),
    apply: () => {
      features.forEach(pushFeature)
      replaceSelection(features)
      writeFeatures(featureIds)
    }
  }
}

/**
 * deleteFeaturesCommand :: [string] -> command
 * Delete features with given ids.
 */
const deleteFeaturesCommand = featureIds => {

  // Create clones (without ids) to re-insert if necessary.
  const features = featuresById(featureIds)
  const clones = features.map(feature => [layerUri(feature), cloneFeature(feature)])

  return {
    inverse: () => insertFeaturesCommand(clones),
    apply: () => {
      features.forEach(removeFeature)
      writeFeatures(featureIds)
    }
  }
}


// --
// SECTION: Clipboard

/**
 * clipboardWrite :: [string] -> unit
 * Write serialize (JSON) features to clipboard.
 */
const clipboardWrite = featureIds => {
  const writeFeatures = feature => [layerUri(feature), geoJSON.writeFeature(feature)]
  const content = featuresById(featureIds).map(writeFeatures)
  ipcRenderer.send('IPC_CLIPBOARD_WRITE', content)
}

/**
 * clipboardRead :: () -> [string, string]
 * Read serialized features from clipboard.
 * Result list contains 2-tuples: layer URI, feature JSON.
 */
const clipboardRead = () =>
  ipcRenderer.invoke('IPC_CLIPBOARD_READ')

/**
 * editSelectAll :: () -> unit
 */
const editSelectAll = () => {

  const features = Object.values(featureCollections)
    .flatMap(collectionArray)
    .filter(isFeatureUnlocked)
    .filter(isFeatureShowing)

  replaceSelection(features)
}

/**
 * editDelete :: () -> unit
 * Delete selected features.
 */
const editDelete = () => {
  const featureIds = selection.selected('feature:')
  const command = deleteFeaturesCommand(featureIds)
  command.apply()
  undo.push(command.inverse())
}

/**
 * editCut :: () -> unit
 * Write current selection to clipboard and delete selected features.
 */
const editCut = () => {
  const featureIds = selection.selected('feature:')
  clipboardWrite(featureIds)

  const command = deleteFeaturesCommand(featureIds)
  command.apply()
  undo.push(command.inverse())
}

/**
 * editCopy :: () -> unit
 * Write current selection to clipboard.
 */
const editCopy = () =>
  clipboardWrite(selection.selected('feature:'))

/**
 * editPaste :: () -> unit
 * Insert features from clipboard.
 */
const editPaste = async () => {
  const readFeature = ([layerUri, json]) => [layerUri, geoJSON.readFeature(json)]

  const content = await clipboardRead()
  if (!content) return

  const clones = content.map(readFeature)
  const command = insertFeaturesCommand(clones)
  command.apply()
  undo.push(command.inverse())
}


// --
// SECTION: Interactions.

const hitTolerance = 3
const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true // macOS: option key
const noShiftKey = ({ originalEvent }) => originalEvent.shiftKey !== true
const conjunction = (...ps) => v => ps.reduce((acc, p) => acc && p(v), true)

/**
 * Select interaction.
 */
const createSelect = () => {
  const interaction = new Select({
    hitTolerance,

    // Operates on all layers including selection (necessary to detect toggles).
    layers: [...Object.values(layers), selectionLayer],
    features: selectedFeatures,
    style,
    condition: conjunction(click, noAltKey),
    toggleCondition: platformModifierKeyOnly, // macOS: command
    multi: false, // don't select all features under cursor at once.
    filter: isFeatureUnlocked
  })

  interaction.on('select', ({ selected, deselected }) => {
    select(selected)
    deselect(deselected)
  })

  return interaction
}


/**
 * Modify interaction.
 */
const createModify = () => {
  let initial = {} // Cloned geometries BEFORE modify.

  const interaction = new Modify({
    hitTolerance,
    features: selectedFeatures,
    // Allow translate while editing (with shift key pressed):
    condition: conjunction(primaryAction, noShiftKey)
  })

  interaction.on('modifystart', ({ features }) => {
    initial = cloneGeometries(features)
  })

  interaction.on('modifyend', ({ features }) => {
    const current = cloneGeometries(features)
    const command = updateGeometryCommand(initial, current)
    undo.push(command)
    writeFeatures(features)
  })

  // Activate Modify interaction only for single-select:
  const activate = () =>
    interaction.setActive(selection.selected('feature:').length === 1)

  selection.on('selected', activate)
  selection.on('deselected', activate)

  return interaction
}


/**
 * Translate, i.e. move feature(s) interaction.
 */
const createTranslate = () => {

  // initial :: (string ~> ol/geom/Geometry)
  // Feature geometries before translate operation.
  let initial = {}

  const interaction = new Translate({
    hitTolerance,
    features: selectedFeatures
  })

  interaction.on('translatestart', ({ features }) => {
    initial = cloneGeometries(features)
  })

  interaction.on('translateend', ({ features }) => {
    const current = cloneGeometries(features)
    const command = updateGeometryCommand(initial, current)

    // NOTE: No need to apply; geometries are already up to date.
    undo.push(command)
    writeFeatures(features)
  })

  return interaction
}


/**
 * Box select interaction.
 */
const createBoxSelect = () => {

  // Note: DragBox is not a selection interaction per se.
  // I.e. it does not manage selected features automatically.
  const interaction = new DragBox({
    condition: platformModifierKeyOnly
  })

  interaction.on('boxend', () => {

    // NOTE: Map rotation is not supported, yet.
    // See original source for implementation:
    // https://openlayers.org/en/latest/examples/box-selection.html

    // Collect features intersecting extent.
    // Note: VectorSource.getFeaturesInExtent(extent) yields unexpected results.

    const features = []
    const extent = interaction.getGeometry().getExtent()
    sources().forEach(source => {
      source.forEachFeatureIntersectingExtent(extent, feature => {
        features.push(feature)
      })
    })

    const isSelected = feature => selection.isSelected(feature.getId())
    const [removals, additions] = R.partition(isSelected)(features)
    removeSelection(removals)
    addSelection(additions.filter(isFeatureUnlocked))
  })

  return interaction
}


// --
// SECTION: IPC/mousetrap hooks.

// Only handle clipboard ops when map has focus.

Mousetrap.bind('del', editDelete) // macOS: fn+backspace
Mousetrap.bind('command+backspace', editDelete)
Mousetrap.bind('esc', clearSelection)

evented.on('MAP_FOCUS', () => {
  ipcRenderer.on('IPC_EDIT_UNDO', undo.undo)
  ipcRenderer.on('IPC_EDIT_REDO', undo.redo)

  ipcRenderer.on('IPC_EDIT_SELECT_ALL', editSelectAll)
  ipcRenderer.on('IPC_EDIT_DELETE', editDelete)
  ipcRenderer.on('IPC_EDIT_CUT', editCut)
  ipcRenderer.on('IPC_EDIT_COPY', editCopy)
  ipcRenderer.on('IPC_EDIT_PASTE', editPaste)
})

evented.on('MAP_BLUR', () => {
  ipcRenderer.off('IPC_EDIT_UNDO', undo.undo)
  ipcRenderer.off('IPC_EDIT_REDO', undo.redo)

  ipcRenderer.off('IPC_EDIT_SELECT_ALL', editSelectAll)
  ipcRenderer.off('IPC_EDIT_DELETE', editDelete)
  ipcRenderer.off('IPC_EDIT_CUT', editCut)
  ipcRenderer.off('IPC_EDIT_COPY', editCopy)
  ipcRenderer.off('IPC_EDIT_PASTE', editPaste)
})


// --
// SECTION: Event handling

evented.on('layer.toggleLock', id => {
  const features = collectionArray(featureCollections[id])
  const locked = !features.some(isFeatureLocked)
  if (locked) {
    removeSelection(features)
    features.forEach(lockFeature)
  } else features.forEach(unlockFeature)

  writeFeatureCollection(id)

  emit({
    type: 'layerLocked',
    id,
    locked
  })
})

evented.on('layer.toggleShow', id => {
  const features = collectionArray(featureCollections[id])
  const hidden = !features.some(isFeatureHidden)
  if (hidden) {
    removeSelection(features)
    features.forEach(hideFeature)
  } else features.forEach(unhideFeature)

  writeFeatureCollection(id)

  emit({
    type: 'layerHidden',
    id,
    hidden
  })
})

// --
// SECTION: Handle project events.

const projectOpened = async map => {
  console.log('[layers] projectOpened()')

  // Set viewport.
  const { center, zoom } = project.preferences().viewport
  map.setCenter(fromLonLat(center))
  map.setZoom(zoom)

  layers = createLayers()
  const filenames = project.layerFiles()
  const featureCollectionEntries = await Promise.all(filenames.map(loadFeatures))
  featureCollectionEntries.forEach(addFeatureCollection)

  Object.values(layers).forEach(map.addLayer)

  // Selection source and layer.
  selectionLayer = new VectorLayer({ style, source: selectionSource })
  map.addLayer(selectionLayer)

  map.addInteraction(createSelect())
  map.addInteraction(createTranslate())
  map.addInteraction(createModify())
  map.addInteraction(createBoxSelect())
}

const projectClosed = map => {
  clearSelection()
  undo.clear()
  map.dispose()
  layers = {}
  featureCollections = {}
}

const projectEventHandlers = {
  open: projectOpened,
  close: projectClosed
}

export default map =>
  project.register(event => {
    console.log('[layers] event', event)
    ;(projectEventHandlers[event] || noop)(map)
  })

export const registerReducer = reducer => {
  pushReducer(reducer)
}

export const deregisterReducer = reducer => {
  const index = reducers.indexOf(reducer)
  if (index !== -1) reducers.splice(index, 1)
}

import fs from 'fs'
import uuid from 'uuid-random'
import { ipcRenderer } from 'electron'
import Mousetrap from 'mousetrap'

import Collection from 'ol/Collection'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { GeoJSON } from 'ol/format'
import Feature from 'ol/Feature'
import { fromLonLat } from 'ol/proj'
import { Select, Modify, Translate, DragBox } from 'ol/interaction'
import { click, primaryAction, platformModifierKeyOnly } from 'ol/events/condition'

import { noop, uniq, K } from '../../shared/combinators'
import style from './style/style'
import project from '../project'
import undo from '../undo'
import selection from '../selection'


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
 * layerUri :: (ol/Feature | string) -> string
 * Map feature id (from feature or feature URI) to URI of containing layer.
 */
const layerUri = featureOrUri => {
  const id = (featureOrUri instanceof Feature)
    ? featureOrUri.getId()
    : featureOrUri

  const layerId = id.match(/feature:(.*)\/.*/)[1]
  return `layer:${layerId}`
}

/**
 * featureId :: ol/Feature -> string
 */
const featureId = feature => feature.getId()

// --
// SECTION: Geometry-specific vector sources and layers.

/**
 * layers :: string ~> ol/layer/Vector
 * Geometry-specific feature vector layers with underlying sources.
 */
let layers = {}

/**
 * selectionLayer :: ol/layer/Vector
 * Layer for currently selected features.
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

const featuresById = ids => ids.map(featureById)


// --
// SECTION: Input layers as feature collections.

/**
 * featureCollections :: string ~> [ol/Collection<ol/Feature>]
 * Feature collections per input layer with layer URI as key.
 */
let featureCollections = {}

const addFeatureCollection = ([layerUri, features]) => {
  featureCollections[layerUri] = features

  // Add features to corresponding source and
  // propagate feature collection updates to sources.

  features.forEach(feature => geometrySource(feature).addFeature(feature))
  features.on('add', ({ element }) => geometrySource(element).addFeature(element))
  features.on('remove', ({ element }) => geometrySource(element).removeFeature(element))
}

/**
 * writeFeatureCollection :: string -> unit
 * Write originating input feature collection back to fs.
 */
const writeFeatureCollection = layerUri => {
  const features = featureCollections[layerUri]

  // Filter internal feature properties.
  // Feature id is excluded from clone by default.
  const clones = features.getArray().map(feature => {
    const clone = feature.clone()
    clone.unset('selected')
    return clone
  })

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
 * GeoJSON, by definitions, comes in WGS84.
 */
const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})


/**
 * loadFeatures :: string -> Promise(ol/Collection)
 * Load input layers as feature collection.
 */
const loadFeatures = async filename => {
  const layerId = uuid()
  const contents = await fs.promises.readFile(filename, 'utf8')

  // Use mutable ol/Collection to write current layer snapshot to file.
  const features = new Collection(geoJSON.readFeatures(contents))
  features.set('filename', filename)

  features.forEach(feature => {
    feature.setId(`feature:${layerId}/${uuid()}`)
  })

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
const select = features => selection.select(features.map(featureId))

/**
 * deselect :: [Feature] => unit
 * Update selection without updating collection.
 */
const deselect = features => selection.deselect(features.map(featureId))

/**
 * addSelection :: [Feature] => unit
 * Update selection and add features to collection.
 */
const addSelection = features => {
  select(features)
  features.forEach(selectedFeatures.push.bind(selectedFeatures))
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
    const updateGeometry = ([feature, geometry]) => {
      feature.setGeometry(geometry)
      return feature
    }

    const features = Object.entries(initial)
      .map(([id, geometry]) => [featureById(id), geometry])
      .map(updateGeometry)

    // Write features/layers back to disk:
    writeFeatures(features)
  }
})

/**
 * insertFeaturesCommand :: (string ~> ol/feature) -> command
 * Add given features to corresponding input layer collections.
 * NOTE: Input layers are identified by feature id (feature map keys).
 */
const insertFeaturesCommand = features => ({
  inverse: () => deleteFeaturesCommand(Object.keys(features)),
  apply: () => {
    const setFeatureId = ([id, feature]) => K(feature)(feature => feature.setId(id))
    Object.entries(features).map(setFeatureId).forEach(pushFeature)
    writeFeatures(Object.keys(features))
  }
})

/**
 * deleteFeaturesCommand :: [string] -> command
 * Delete features with given ids.
 */
const deleteFeaturesCommand = featureIds => {

  // Collect state to revert command effect.
  const putClone = feature => acc => (acc[feature.getId()] = feature.clone())
  const clones = featuresById(featureIds)
    .reduce((acc, feature) => K(acc)(putClone(feature)), {})

  return {
    inverse: () => insertFeaturesCommand(clones),
    apply: () => {
      featuresById(featureIds).forEach(removeFeature)
      writeFeatures(featureIds)
    }
  }
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
    layers: [...Object.values(layers), selectionLayer],
    features: selectedFeatures,
    style,
    condition: conjunction(click, noAltKey),
    toggleCondition: platformModifierKeyOnly, // macOS: command
    multi: false // don't select all features under cursor at once.
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

    const [additions, removals] = features.reduce((acc, feature) => {
      if (selection.isSelected(feature.getId())) acc[1].push(feature)
      else acc[0].push(feature)
      return acc
    }, [[], []])

    removeSelection(removals)
    addSelection(additions)
  })

  return interaction
}


// --
// SECTION: IPC/mousetrap hooks.

const deleteSelection = () => {
  const featureIds = selection.selected('feature:')
  clearSelection()

  const command = deleteFeaturesCommand(featureIds)
  command.apply()
  undo.push(command.inverse())
}

ipcRenderer.on('IPC_EDIT_SELECT_ALL', () => {
  clearSelection()
  const features = sources().reduce((acc, source) => acc.concat(source.getFeatures()), [])
  addSelection(features)
})

ipcRenderer.on('IPC_EDIT_DELETE', deleteSelection)
Mousetrap.bind('del', deleteSelection) // macOS: fn+backspace
Mousetrap.bind('command+backspace', deleteSelection)

// --
// SECTION: Handle project events.

const projectOpened = async map => {

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
  project.register(event => (projectEventHandlers[event] || noop)(map))

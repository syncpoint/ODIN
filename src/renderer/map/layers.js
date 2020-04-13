import fs from 'fs'
import uuid from 'uuid-random'
import * as R from 'ramda'
import { ipcRenderer } from 'electron'

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
// SECTION: Module-global resources maintained for open project.

/**
 * layers :: string ~> ol/layer/Vector
 * Geometry-specific feature vector layers with underlying sources.
 */
let layers = {}

/**
 * featureCollections :: string ~> [ol/Collection<ol/Feature>]
 * Feature collections per input layer with layer URI as key.
 */
let featureCollections = {}

/**
 * Vector source for dedicated selection layer.
 * NOTE: Created once; re-used throughout renderer lifetime.
 */
const selectionSource = new VectorSource()

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
 * sources :: () -> [ol/source/Vector]
 * Underlying layer sources.
 */
const sources = () => Object.values(layers).map(layer => layer.getSource())

/**
 * geometrySource :: (ol/Feature | ol/geom/Geometry) -> ol/source/Vector
 * Source for given feature or feature geometry.
 */
const geometrySource = object => layers[geometryType(object)].getSource()


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
 * writeLayer :: ol/Collection<ol/Feature> -> unit
 * Write originating input feature collection back to fs.
 */
const writeLayer = features => {

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
 * writeFeatures :: (ol/Collection<ol/Feature> | [ol/Feature]) -> unit
 * Write feature array or colleciton back to fs.
 */
const writeFeatures = features => {
  const asArray = features => features instanceof Collection
    ? features.getArray()
    : features

  R.uniq(asArray(features).map(layerUri))
    .map(uri => featureCollections[uri])
    .forEach(writeLayer)
}


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
    const hasSelection = selection.selected().length
    entries.forEach(([_, layer]) => layer.setOpacity(hasSelection ? 0.35 : 1))
  }

  selection.on('selected', updateOpacity)
  selection.on('deselected', updateOpacity)

  return Object.fromEntries(entries)
}


/**
 * Populate layers and setup sync feature collection -> layer source.
 */
const linkLayers = features => {
  const onremove = ({ element }) => geometrySource(element).removeFeature(element)
  const onadd = ({ element }) => geometrySource(element).addFeature(element)

  features.forEach(feature => geometrySource(feature).addFeature(feature))
  features.on('add', onadd)
  features.on('remove', onremove)
}

// --
// SECTION: Selection handling.
// Manage collection of selected features and feature selection state.
// It is necessary to manage two levels independently, because some
// interactions have to update selected feature collection explicitly
// (contrary to select interaction).

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
;(() => {
  const move = (from, to) => f => { from.removeFeature(f); to.addFeature(f) }

  selection.on('selected', uris => {
    const lookup = featureById(sources())
    uris.map(lookup).forEach(feature => {
      feature.set('selected', true)
      move(geometrySource(feature), selectionSource)(feature)
    })
  })

  selection.on('deselected', uris => {
    const lookup = featureById([selectionSource])
    uris.map(lookup).forEach(feature => {
      feature.unset('selected')
      feature.setStyle(null) // release cached style, if any
      move(selectionSource, geometrySource(feature))(feature)
    })
  })
})()


// --
// SECTION: Commands (with undo/redo support).

const updateGeometryCommand = (initial, current) => ({
  inverse: () => updateGeometryCommand(current, initial),
  apply: () => {
    const features = Object.entries(initial).reduce((acc, [id, geometry]) => {
      const source = geometrySource(geometry)
      const feature = selectionSource.getFeatureById(id) || source.getFeatureById(id)
      feature.setGeometry(geometry)
      return acc.concat(feature)
    }, [])

    // Write features/layers back to disk:
    writeFeatures(features)
  }
})

const insertFeaturesCommand = features => {

  return {
    inverse: () => deleteFeaturesCommand(Object.keys(features)),
    apply: () => {
      const setFeatureId = ([id, feature]) => K(feature)(feature => feature.setId(id))
      const pushFeature = feature => featureCollections[layerUri(feature)].push(feature)
      Object.entries(features).map(setFeatureId).forEach(pushFeature)

      Object.keys(features)
        .map(featureId => featureId.match(/feature:(.*)\/.*/)[1])
        .map(layerId => `layer:${layerId}`)
        .filter(uniq)
        .map(layerUri => featureCollections[layerUri])
        .forEach(features => writeLayer(features))
    }
  }
}

const deleteFeaturesCommand = featureIds => {

  // Collect state to revert effect.
  const setClone = feature => acc => (acc[feature.getId()] = feature.clone())
  const clones = featureIds
    .map(featureById(sources()))
    .reduce((acc, feature) => K(acc)(setClone(feature)), {})

  return {
    inverse: () => insertFeaturesCommand(clones),
    apply: () => {
      const removeFeature = feature => featureCollections[layerUri(feature)].remove(feature)
      featureIds.map(featureById(sources())).forEach(removeFeature)

      // FIXME: redundant (insertFeaturesCommand.apply)
      featureIds
        .map(featureId => featureId.match(/feature:(.*)\/.*/)[1])
        .map(layerId => `layer:${layerId}`)
        .filter(uniq)
        .map(layerUri => featureCollections[layerUri])
        .forEach(features => writeLayer(features))
    }
  }
}


// --
// SECTION: Interactions.

const hitTolerance = 3
const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true
const noShiftKey = ({ originalEvent }) => originalEvent.shiftKey !== true
const conjunction = (...ps) => v => ps.reduce((a, b) => a(v) && b(v))
const featureId = feature => feature.getId()

const featureById = ([head, ...tail]) => id => head
  ? head.getFeatureById(id) || featureById(tail)(id)
  : null

const layerUri = feature => {
  const featureId = feature.getId()
  const layerId = featureId.match(/feature:(.*)\/.*/)[1]
  return `layer:${layerId}`
}

const cloneGeometries = features => features.getArray().reduce((acc, feature) => {
  acc[feature.getId()] = feature.getGeometry().clone()
  return acc
}, {})


/**
 *
 */
const createSelect = () => {

  const interaction = new Select({
    hitTolerance,
    layers: Object.values(layers),
    features: selectedFeatures,
    style,
    condition: conjunction(click, noAltKey),
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
  let initial = {}

  const interaction = new Modify({
    hitTolerance,
    features: selectedFeatures,
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

  // Note: DragBox is not a selecttion interaction per se.
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

    addSelection(features)
  })

  return interaction
}


// --
// SECTION: IPC hooks.

ipcRenderer.on('IPC_EDIT_SELECT_ALL', () => {
  clearSelection()
  const features = sources().reduce((acc, source) => acc.concat(source.getFeatures()), [])
  addSelection(features)
})

ipcRenderer.on('IPC_EDIT_DELETE', () => {
  const featureIds = selection.selected().filter(s => s.startsWith('feature:'))
  clearSelection()

  const command = deleteFeaturesCommand(featureIds)
  command.apply()
  undo.push(command.inverse())
})

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
  featureCollections = Object.fromEntries(featureCollectionEntries)
  Object.values(featureCollections).forEach(linkLayers)

  Object.values(layers).forEach(map.addLayer)

  // Selection source and layer.
  const selectionLayer = new VectorLayer({ style, source: selectionSource })
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

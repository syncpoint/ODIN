import { ipcRenderer } from 'electron'
import Mousetrap from 'mousetrap'
import * as R from 'ramda'

import Collection from 'ol/Collection'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { GeoJSON } from 'ol/format'
import Feature from 'ol/Feature'
import { Select, Modify, Translate, DragBox } from 'ol/interaction'
import { click, primaryAction, platformModifierKeyOnly } from 'ol/events/condition'

import { noop, K } from '../../shared/combinators'
import style from './style/style'
import inputLayers from '../project/layers'
import undo from '../undo'
import selection from '../selection'
import evented from '../evented'


// --
// SECTION: Module-global (utility) functions.

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
 * Map features to cloned featue geometries identified by feature ids.
 */
const cloneGeometries = features =>
  features
    .map(feature => [feature.getId(), feature.getGeometry().clone()])
    .reduce((acc, [id, geometry]) => K(acc)(acc => (acc[id] = geometry)), {})

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

const addFeature = feature =>
  geometrySource(feature).addFeature(feature)

const removeFeature = feature => {
  const source = selection.isSelected(feature.getId())
    ? selectionSource
    : geometrySource(feature)

  source.removeFeature(feature)
  selection.deselect([feature.getId()])
}

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
    geometrySource(feature).removeFeature(feature)
    selectionSource.addFeature(feature)
  })
})

selection.on('deselected', ids => {
  featuresById(ids).forEach(feature => {
    feature.setStyle(null) // release cached style, if any
    selectionSource.removeFeature(feature)
    geometrySource(feature).addFeature(feature)
  })
})


// --
// SECTION: Clipboard

/**
 * clipboardWrite :: [string] -> unit
 * Write serialize (JSON) features to clipboard.
 */
const clipboardWrite = featureIds => {
  const writeFeatures = feature => [feature.get('layerId'), geoJSON.writeFeature(feature)]
  const content = featuresById(featureIds).map(writeFeatures)
  ipcRenderer.send('IPC_CLIPBOARD_WRITE', content)
}



/**
 * editSelectAll :: () -> unit
 */
const editSelectAll = () => {
  const features = sources().reduce((acc, source) => acc.concat(source.getFeatures()), [])
  replaceSelection(features)
}

/**
 * editDelete :: () -> unit
 * Delete selected features.
 */
const editDelete = () => {
  const featureIds = selection.selected('feature:')
  inputLayers.removeFeatures(featureIds)
}

/**
 * editCut :: () -> unit
 * Write current selection to clipboard and delete selected features.
 */
const editCut = () => {
  const featureIds = selection.selected('feature:')
  clipboardWrite(featureIds)
  inputLayers.removeFeatures(featureIds)
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
  const content = await ipcRenderer.invoke('IPC_CLIPBOARD_READ')
  if (!content) return
  inputLayers.addFeatures(content)
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
    initial = cloneGeometries(features.getArray())
  })

  interaction.on('modifyend', ({ features }) => {
    inputLayers.updateGeometries(initial, features.getArray())
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
    initial = cloneGeometries(features.getArray())
  })

  interaction.on('translateend', ({ features }) => {
    inputLayers.updateGeometries(initial, features.getArray())
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
    addSelection(additions)
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
  evented.on('EDIT_UNDO', undo.undo)
  evented.on('EDIT_REDO', undo.redo)

  evented.on('EDIT_SELECT_ALL', editSelectAll)
  evented.on('EDIT_DELETE', editDelete)
  evented.on('EDIT_CUT', editCut)
  evented.on('EDIT_COPY', editCopy)
  evented.on('EDIT_PASTE', editPaste)
})

evented.on('MAP_BLUR', () => {
  evented.off('EDIT_UNDO', undo.undo)
  evented.off('EDIT_REDO', undo.redo)

  evented.off('EDIT_SELECT_ALL', editSelectAll)
  evented.off('EDIT_DELETE', editDelete)
  evented.off('EDIT_CUT', editCut)
  evented.off('EDIT_COPY', editCopy)
  evented.off('EDIT_PASTE', editPaste)
})


// --
// SECTION: Handle project events.


const eventHandlers = {
  featuresadded: ({ features, selected }) => {
    features.forEach(addFeature)
    if (selected) replaceSelection(features)
  },
  featuresremoved: ({ ids }) => {
    selection.deselect(ids)
    ids.map(featureById).forEach(removeFeature)
  }
}

export default map => {
  layers = createLayers()
  Object.values(layers).forEach(map.addLayer)

  // Selection source and layer.
  selectionLayer = new VectorLayer({ style, source: selectionSource })
  map.addLayer(selectionLayer)

  map.addInteraction(createSelect())
  map.addInteraction(createTranslate())
  map.addInteraction(createModify())
  map.addInteraction(createBoxSelect())

  inputLayers.register(event => (eventHandlers[event.type] || noop)(event))
}

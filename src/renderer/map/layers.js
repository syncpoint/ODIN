import * as R from 'ramda'

import Collection from 'ol/Collection'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import * as ol from 'ol'
import { Select, Modify, Translate, DragBox } from 'ol/interaction'
import { click, primaryAction, platformModifierKeyOnly } from 'ol/events/condition'
import Style from 'ol/style/Style'

import { noop, K } from '../../shared/combinators'
import style from './style/style'
import inputLayers from '../project/input-layers'
import Feature from '../project/Feature'
import URI from '../project/URI'
import selection from '../selection'


// --
// SECTION: Module-global (utility) functions.

/**
 * geometryType :: (ol/Feature | ol/geom/Geometry) -> string
 * Map feature or feature geometry to rendered layer type.
 */
const geometryType = object => {
  const type = object instanceof ol.Feature
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
    .map(feature => [Feature.id(feature), Feature.cloneGeometry(feature)])
    .reduce((acc, [id, geometry]) => K(acc)(acc => (acc[id] = geometry)), {})

const hideFeature = feature => feature.setStyle(new Style(null))
const unhideFeature = feature => feature.setStyle(null)

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

const layerFeatures = layerId => sources()
  .reduce((acc, source) => acc.concat(source.getFeatures()), [])
  .filter(Feature.hasLayerId(layerId))

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

const addFeature = feature => {
  if (Feature.hidden(feature)) feature.setStyle(new Style(null))
  geometrySource(feature).addFeature(feature)
}

const removeFeature = feature => {
  const source = selection.isSelected(Feature.id(feature))
    ? selectionSource
    : geometrySource(feature)

  source.removeFeature(feature)
}

// --
// SECTION: Setup layers from project.


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
    const hasSelection = selection
      .selected(URI.isFeatureId)
      .map(featureById)
      .filter(Feature.showing)
      .filter(Feature.unlocked)
      .length

    entries.forEach(([_, layer]) => layer.setOpacity(hasSelection ? 0.35 : 1))
  }

  selection.on('selected', updateOpacity)
  selection.on('deselected', updateOpacity)

  return Object.fromEntries(entries)
}


// --
// SECTION: Selection handling.
// Manage collection of selected features and feature selection state.

/**
 * selectedFeatures :: ol/Collection<ol/Feature>
 * NOTE: With unique options, collection throws when duplicate is added.
 */
const selectedFeatures = new Collection([], { unique: true })

/**
 * select :: [ol/Feature] => unit
 * Update selection without updating collection.
 */
const select = features => {
  // Deselect others than feature:
  const removals = selection.selected(uri => !URI.isFeatureId(uri))
  selection.deselect(removals)
  selection.select(features.map(Feature.id))
}


/**
 * deselect :: [Feature] => unit
 * Update selection without updating collection.
 */
const deselect = features =>
  selection.deselect(features.map(Feature.id))

/**
 * addSelection :: [Feature] => unit
 * Update selection and add features to collection.
 */
const addSelection = features => {
  select(features)

  features
    .filter(feature => selectedFeatures.getArray().indexOf(feature) === -1)
    .forEach(selectedFeatures.push.bind(selectedFeatures))
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

  // Move selected features to dedicated source/layer:
  featuresById(ids)
    .filter(Feature.showing)
    .filter(Feature.unlocked)
    .forEach(feature => {

      // If triggered from the outside, chances are that
      // the feature is not already contained in
      // selected feature collection.
      // NOTE: Respect uniqueness.

      if (selectedFeatures.getArray().indexOf(feature) === -1) {
        selectedFeatures.push(feature)
      }

      geometrySource(feature).removeFeature(feature)
      selectionSource.addFeature(feature)
    })
})

selection.on('deselected', ids => featuresById(ids)
  .forEach(feature => {
    selectedFeatures.remove(feature)

    // Hidden features are not moved to selection source.
    if (selectionSource.hasFeature(feature)) {
      feature.setStyle(null) // release cached style, if any
      selectionSource.removeFeature(feature)
      geometrySource(feature).addFeature(feature)
    }
  }))


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
    filter: Feature.unlocked
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
  const activate = () => {
    const features = selection.selected(URI.isFeatureId)
      .map(featureById)
      .filter(Feature.showing)

    interaction.setActive(features.length === 1)
  }

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
        if (Feature.showing(feature)) features.push(feature)
      })
    })

    const isSelected = feature => selection.isSelected(Feature.id(feature))
    const [removals, additions] = R.partition(isSelected)(features)
    removeSelection(removals)
    addSelection(additions.filter(Feature.unlocked))
  })

  return interaction
}


// --
// SECTION: Handle project/layer events.


const eventHandlers = {
  featuresadded: ({ features, selected }) => {
    features.forEach(addFeature)
    if (selected) replaceSelection(features)
  },
  featuresremoved: ({ ids }) => {
    ids.map(featureById).forEach(removeFeature)
  },
  featurepropertiesupdated: ({ featureId, properties }) => {
    const feature = featureById(featureId)
    if (!feature) return

    feature.setStyle(null)
    feature.setProperties(properties)
  },
  layerhidden: ({ layerId, hidden }) => {
    const toggle = hidden ? hideFeature : unhideFeature
    sources()
      .reduce((acc, source) => acc.concat(source.getFeatures()), [])
      .filter(Feature.hasLayerId(layerId))
      .forEach(toggle)
  },
  layerremoved: ({ layerId }) => {
    layerFeatures(layerId).forEach(removeFeature)
  },
  layeradded: ({ _, features }) => {
    features.forEach(addFeature)
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

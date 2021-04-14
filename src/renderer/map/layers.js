import * as R from 'ramda'

import Collection from 'ol/Collection'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { Select, Translate, DragBox, Snap } from 'ol/interaction'
import { click, primaryAction, platformModifierKeyOnly } from 'ol/events/condition'
import Style from 'ol/style/Style'

import { noop, K } from '../../shared/combinators'
import style from './style/style'
import inputLayers from '../project/input-layers'
import Feature from '../project/Feature'
import URI from '../project/URI'
import selection from '../selection'
import { Modify } from './interaction/Modify'
import { OffsetLocation } from './interaction/offset-location'
import * as descriptors from '../components/feature-descriptors'

// --
// SECTION: Module-global (utility) functions.

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

let layer

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
  layer.getSource(),
  selectionSource
]

const layerFeatures = layerId => sources()
  .reduce((acc, source) => acc.concat(source.getFeatures()), [])
  .filter(Feature.hasLayerId(layerId))

const geometrySource = () => layer.getSource()

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

const selectedFeaturesCount = () => selection
  .selected(URI.isFeatureId)
  .map(featureById)
  .filter(Feature.showing)
  .filter(Feature.unlocked)
  .length

const createLayer = () => {
  const source = new VectorSource({})
  const layer = new VectorLayer({ source, style: style('default') })

  // Update layer opacity depending on selection.

  const updateOpacity = () => {
    layer.setOpacity(selectedFeaturesCount() ? 0.35 : 1)
  }

  selection.on('selected', updateOpacity)
  selection.on('deselected', updateOpacity)

  return layer
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
 * removeSelection :: [ol/Feature] => unit
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
    layers: [layer, selectionLayer],
    features: selectedFeatures,
    style: (feature, resolution) => {
      const fn = interaction.getFeatures().getLength() < 2
        ? style('selected')
        : style('multi')
      return fn(feature, resolution)
    },
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
const createModify = source => {
  let initial = {} // Cloned geometries BEFORE modify.

  const interaction = new Modify({
    hitTolerance,
    source,
    // Allow translate while editing (with shift key pressed):
    condition: conjunction(primaryAction, noShiftKey),
    showVertexCondition: event => {
      // Always show when snapped to exising geometry vertex:
      if (event.snappedToVertex) return true

      // Don't show when feature's max point is limited to two:
      const sidc = event.feature.get('sidc')
      return descriptors.maxPoints(sidc) !== 2
    }
  })

  interaction.on('modifystart', ({ features }) => {
    initial = cloneGeometries(features.getArray())
  })

  interaction.on('modifyend', ({ features }) => {
    inputLayers.updateGeometries(initial, features.getArray())
  })

  return interaction
}


const createOffsetLocation = source => {
  let initial = {} // Cloned geometries BEFORE offset.
  const interaction = new OffsetLocation({ source })

  interaction.on('offsetstart', ({ features }) => {
    initial = cloneGeometries(features.getArray())
  })

  interaction.on('offsetend', ({ features }) => {
    inputLayers.updateGeometries(initial, features.getArray())
  })

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
  snapshot: ({ features }) => {
    features.forEach(addFeature)
  },
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
  layeradded: ({ features }) => {
    features.forEach(addFeature)
  }
}

export default map => {
  const addLayer = layer => K(layer)(layer => map.addLayer(layer))
  const addInteraction = map.addInteraction.bind(map)

  layer = createLayer()
  map.addLayer(layer)

  // Selection source and layer.
  selectionLayer = addLayer(new VectorLayer({
    source: selectionSource,
    style: style('selected')
  }))

  const select = createSelect()
  addInteraction(select)
  addInteraction(createTranslate())
  addInteraction(createBoxSelect())

  // Decouple selected feature collection from modify source.
  // Reason: We can only edit one feature at a time.
  //   Adding/removing geometry segments to modify's spatial index
  //   is slow for many features/segments.
  //   By decoupling we make sure, only one feature is added
  //   to the source (at max). Contains the selected feature collection
  //   more than one feature, we clear the source.

  const modifySource = new VectorSource()
  selectedFeatures.on('add', ({ element }) => {
    if (selectedFeatures.getLength() <= 1) modifySource.addFeature(element)
    else modifySource.clear()
  })

  selectedFeatures.on('remove', ({ element }) => {
    if (!modifySource.hasFeature(element)) return
    modifySource.removeFeature(element)
  })

  addInteraction(createModify(modifySource))
  addInteraction(createOffsetLocation(modifySource))

  addInteraction(new Snap({
    source: layer.getSource()
  }))

  inputLayers.register(event => (eventHandlers[event.type] || noop)(event))
}

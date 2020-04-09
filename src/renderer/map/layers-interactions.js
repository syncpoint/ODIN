import { Select, Modify, Translate, DragBox } from 'ol/interaction'
import { click, primaryAction, platformModifierKeyOnly } from 'ol/events/condition'
import style from './style/style'
import undo from '../undo'
import { updateFeatureGeometry } from './layers-commands'
import { syncFeatures, geometryType, featureId, featureById } from './layers-util'
import selection from '../selection'

const hitTolerance = 3


// Non-standard conditions for Select/Modify interactions.
const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true
const noShiftKey = ({ originalEvent }) => originalEvent.shiftKey !== true
const conjunction = (...ps) => v => ps.reduce((a, b) => a(v) && b(v))

const cloneGeometries = features => features.getArray().reduce((acc, feature) => {
  acc[feature.getId()] = feature.getGeometry().clone()
  return acc
}, {})


/**
 * Modify interaction.
 */
export const modify = context => {
  const { selectedFeatures } = context
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
    const command = updateFeatureGeometry(context, initial, current)
    undo.push(command)
    syncFeatures(features)
  })

  return interaction
}


/**
 * Translate, i.e. move feature(s) interaction.
 */
export const translate = context => {
  const { selectedFeatures } = context
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
    const command = updateFeatureGeometry(context, initial, current)
    undo.push(command)
    syncFeatures(features)
  })

  return interaction
}


/**
 * Select interaction.
 * NOTE: Default condition is changed to ignore alt/option-click, because
 * alt/option conflicts with modify interaction (delete point).
 * @param {[Feature]]} layers feature layer array
 */
export const select = context => {
  const { layers, sources, selectionSource } = context
  const move = (from, to) => f => { from.removeFeature(f); to.addFeature(f) }

  const interaction = new Select({
    hitTolerance,
    layers,
    style,
    condition: conjunction(click, noAltKey),
    multi: false
  })

  // CAUTION: selectedFeatures - shared/mutable feature collection
  context.selectedFeatures = interaction.getFeatures()

  const updateOpacity = () => {
    // Dim feature layers except selection layer:
    const hasSelection = interaction.getFeatures().getLength() > 0
    layers.forEach(layer => layer.setOpacity(hasSelection ? 0.35 : 1))
  }

  selection.on('selected', uris => {
    const selectedFeatures = interaction.getFeatures()
    const lookup = featureById(Object.values(sources))
    uris.map(lookup).forEach(feature => {
      feature.set('selected', true)
      const from = sources[geometryType(feature)]
      move(from, selectionSource)(feature)

      // Explicitly add to selected feature collection if not already included.
      // This is necessary for box selection or any other interaction except select.
      //
      if (!selectedFeatures.getArray().includes(feature)) selectedFeatures.push(feature)
    })

    updateOpacity()
  })

  selection.on('deselected', uris => {
    const lookup = featureById([selectionSource])
    uris.map(lookup).forEach(feature => {
      feature.unset('selected')
      feature.setStyle(null)
      const to = sources[geometryType(feature)]
      move(selectionSource, to)(feature)
    })

    updateOpacity()
  })

  interaction.on('select', ({ selected, deselected }) => {
    selection.select(selected.map(featureId))
    selection.deselect(deselected.map(featureId))
  })

  return interaction
}


/**
 * Lasso, aka box selection.
 * TODO: should support adding to current selections (SHIFT+COMMAND+DRAG)
 */
export const lasso = context => {
  const { sources } = context

  const interaction = new DragBox({
    condition: platformModifierKeyOnly
  })

  interaction.on('boxstart', () => selection.deselect())
  interaction.on('boxend', () => {

    // NOTE: Map rotation is not supported, yet.
    // See original source for implementation:
    // https://openlayers.org/en/latest/examples/box-selection.html

    // Collect features intersecting extent.
    // Note: VectorSource.getFeaturesInExtent(extent) yields unexpected results.
    //
    const features = []
    const extent = interaction.getGeometry().getExtent()
    Object.values(sources).forEach(source => {
      source.forEachFeatureIntersectingExtent(extent, feature => {
        features.push(feature)
      })
    })

    selection.select(features.map(featureId))
  })

  return interaction
}

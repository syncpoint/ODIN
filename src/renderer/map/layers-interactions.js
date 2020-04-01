import { Select, Modify, Translate, DragBox } from 'ol/interaction'
import { click, primaryAction, platformModifierKeyOnly } from 'ol/events/condition'
import style from './style/style'
import undo from '../undo'
import { updateFeatureGeometry } from './layers-commands'
import { syncFeatures, geometryType } from './layers-util'

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

  // TODO: encapsulate `context.selectedFeatures` with mutators as selection

  // CAUTION: selectedFeatures - shared/mutable feature collection
  context.selectedFeatures = interaction.getFeatures()

  context.selectFeature = feature => {
    feature.set('selected', true)
    const from = sources[geometryType(feature)]
    move(from, selectionSource)(feature)
  }

  context.deselectFeature = feature => {
    feature.unset('selected')
    feature.setStyle(null)
    const to = sources[geometryType(feature)]
    move(selectionSource, to)(feature)
  }

  context.deselectAllFeatures = () => {
    context.selectedFeatures.forEach(context.deselectFeature)
    context.selectedFeatures.clear()
  }

  context.selectAllFeatures = () => {
    Object.values(sources).forEach(source => {
      source.getFeatures().forEach(feature => {
        context.selectFeature(feature)
        context.selectedFeatures.push(feature)
      })
    })
  }


  interaction.on('select', ({ selected, deselected }) => {
    // Dim feature layers except selection layer:
    layers.forEach(layer => layer.setOpacity(selected.length ? 0.35 : 1))
    selected.forEach(context.selectFeature)
    deselected.forEach(context.deselectFeature)
  })

  return interaction
}


/**
 * Lasso, aka box selection.
 */
export const lasso = context => {
  const { selectedFeatures, sources, layers } = context

  const interaction = new DragBox({
    condition: platformModifierKeyOnly
  })

  interaction.on('boxstart', context.deselectAllFeatures)

  interaction.on('boxend', () => {

    // NOTE: Map rotation is not supported, yet.
    // See original source for implementation:
    // https://openlayers.org/en/latest/examples/box-selection.html

    const extent = interaction.getGeometry().getExtent()
    Object.values(sources).forEach(source => {
      source.forEachFeatureIntersectingExtent(extent, feature => {
        context.selectFeature(feature)
        selectedFeatures.push(feature)
      })
    })

    const opacity = selectedFeatures.getLength() > 0 ? 0.35 : 1
    layers.forEach(layer => layer.setOpacity(opacity))
  })

  return interaction
}

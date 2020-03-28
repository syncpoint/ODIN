import { Select, Modify, Translate } from 'ol/interaction'
import { click, primaryAction } from 'ol/events/condition'
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
  const { select } = context
  let initial = {}

  const interaction = new Modify({
    hitTolerance,
    features: select.getFeatures(),
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
  const { select } = context
  let initial = {}

  const interaction = new Translate({
    hitTolerance,
    features: select.getFeatures()
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
  const { layers } = context
  const move = (from, to) => f => { from.removeFeature(f); to.addFeature(f) }

  const interaction = new Select({
    hitTolerance,
    layers,
    style,
    condition: conjunction(click, noAltKey),
    multi: false
  })

  interaction.on('select', ({ selected, deselected }) => {
    // Dim feature layers except selection layer:
    context.layers.forEach(layer => layer.setOpacity(selected.length ? 0.35 : 1))

    selected.forEach(feature => {
      const from = context.sources[geometryType(feature)]
      move(from, context.selectionSource)(feature)
    })

    deselected.forEach(feature => {
      const to = context.sources[geometryType(feature)]
      move(context.selectionSource, to)(feature)
    })
  })

  return interaction
}

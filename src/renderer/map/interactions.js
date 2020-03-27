import { Select, Modify, Translate } from 'ol/interaction'
import { click, primaryAction } from 'ol/events/condition'
import * as R from 'ramda'
import style from './style/style'
import undo from '../undo'

const hitTolerance = 3

// Syncing, i.e. writing, feature layer back to fs.
// Shared by Modify and Translate interactions.
// NOTE: Features are expected to supply a 'sync' function,
// which writes the feature along with its originating layer
// back to disk.
const sync = feature => feature.get('sync')
const uniqSync = features => R.uniq(features.getArray().map(sync))
const syncFeatures = ({ features }) => uniqSync(features).forEach(fn => fn())

// Non-standard conditions for Select/Modify interactions.
const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true
const noShiftKey = ({ originalEvent }) => originalEvent.shiftKey !== true
const conjunction = (...ps) => v => ps.reduce((a, b) => a(v) && b(v))

const cloneGeometries = features => features.getArray().reduce((acc, feature) => {
  acc[feature.ol_uid] = feature.getGeometry().clone()
  return acc
}, {})


/**
 * Modify interaction.
 * @param {Collection<Feature>} features selected features collection
 */
export const modifyInteraction = context => features => {
  let initial = {}

  const interaction = new Modify({
    hitTolerance,
    features,
    condition: conjunction(primaryAction, noShiftKey)
  })

  interaction.on('modifystart', event => {
    const { features } = event
    initial = cloneGeometries(features)
  })

  interaction.on('modifyend', event => {
    const { features } = event
    const current = cloneGeometries(features)
    const command = context.updateFeatureGeometry(initial, current)
    undo.push(command)
    syncFeatures(event)
  })

  return interaction
}


/**
 * Translate, i.e. move feature(s) interaction.
 * @param {Collection<Feature>} features selected features collection
 * @param {*} syncFeatures layer writer
 */
export const translateInteraction = context => features => {
  let initial = {}

  const interaction = new Translate({
    hitTolerance,
    features
  })

  interaction.on('translatestart', event => {
    const { features } = event
    initial = cloneGeometries(features)
  })

  interaction.on('translateend', event => {
    const { features } = event
    const current = cloneGeometries(features)
    const command = context.updateFeatureGeometry(initial, current)
    undo.push(command)
    syncFeatures(event)
  })

  return interaction
}


/**
 * Select interaction.
 * NOTE: Default condition is changed to ignore alt/option-click, because
 * alt/option conflicts with modify interaction (delete point).
 * @param {[Feature]]} layers feature layer array
 */
export const selectInteraction = layers => new Select({
  hitTolerance,
  layers,
  style,
  condition: conjunction(click, noAltKey),
  multi: false
})

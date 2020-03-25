import { Select, Modify, Translate } from 'ol/interaction'
import { click, primaryAction } from 'ol/events/condition'
import * as R from 'ramda'
import style from './style/style'

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


/**
 * Modify interaction.
 * @param {Collection<Feature>} features selected features collection
 */
export const modifyInteraction = features => {
  const interaction = new Modify({
    hitTolerance,
    features,
    condition: conjunction(primaryAction, noShiftKey)
  })

  interaction.on('modifyend', syncFeatures)
  return interaction
}


/**
 * Translate, i.e. Move interaction.
 * @param {Collection<Feature>} features selected features collection
 * @param {*} syncFeatures layer writer
 */
export const translateInteraction = features => {
  const interaction = new Translate({
    hitTolerance,
    features
  })

  interaction.on('translateend', syncFeatures)
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

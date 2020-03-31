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

  interaction.on('select', ({ selected, deselected }) => {
    // Dim feature layers except selection layer:
    layers.forEach(layer => layer.setOpacity(selected.length ? 0.35 : 1))

    selected.forEach(feature => {
      feature.set('selected', true)
      const from = sources[geometryType(feature)]
      move(from, selectionSource)(feature)
    })

    deselected.forEach(feature => {
      feature.unset('selected')
      // Clear style cache: invoke style function on next render.
      feature.setStyle(null)
      const to = sources[geometryType(feature)]
      move(selectionSource, to)(feature)
    })
  })

  return interaction
}

export const lasso = context => {
  const { selectedFeatures, map, sources } = context

  const interaction = new DragBox({
    condition: platformModifierKeyOnly
  })

  interaction.on('boxstart', () => selectedFeatures.clear())

  interaction.on('boxend', () => {
    // Features that intersect the box geometry are added to the
    // collection of selected features.

    // If the view is not obliquely rotated the box geometry and
    // its extent are equalivalent so intersecting features can
    // be added directly to the collection.
    //
    const rotation = map.rotation()
    const oblique = rotation % (Math.PI / 2) !== 0
    const candidates = oblique ? [] : selectedFeatures
    const extent = interaction.getGeometry().getExtent()

    Object.values(sources).forEach(source => {
      source.forEachFeatureIntersectingExtent(extent, feature => {
        candidates.push(feature)
      })
    })

    // When the view is obliquely rotated the box extent will
    // exceed its geometry so both the box and the candidate
    // feature geometries are rotated around a common anchor
    // to confirm that, with the box geometry aligned with its
    // extent, the geometries intersect.
    //
    if (oblique) {
      const anchor = [0, 0]
      const geometry = interaction.getGeometry().clone()
      geometry.rotate(-rotation, anchor)
      const extent = geometry.getExtent()
      candidates.forEach(feature => {
        const geometry = feature.getGeometry().clone()
        geometry.rotate(-rotation, anchor)
        if (geometry.intersectsExtent(extent)) {
          selectedFeatures.push(feature)
        }
      })
    }
  })

  return interaction
}

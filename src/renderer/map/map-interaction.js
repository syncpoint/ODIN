import { Select, Modify } from 'ol/interaction'
import { click } from 'ol/events/condition'

const hitTolerance = 3

/**
 * @param {VectorLayer} opts.featureLayer - feature layers for select
 * @param {VectorLayer} opts.selectionLayer - layer for selected features
 * @param {function} opt.style - style function for select
 */
export const interactions = map => opts => {
  const featureSource = opts.featureLayer.getSource()
  const selectionSource = opts.selectionLayer.getSource()

  const select = new Select({
    hitTolerance,
    layers: [opts.featureLayer],
    style: opts.style,
    condition: click // faster than single click
  })

  const modify = new Modify({
    hitTolerance,
    features: select.getFeatures()
  })

  select.on('select', ({ selected, deselected }) => {
    opts.featureLayer.setOpacity(selected.length ? 0.35 : 1)
    const move = (from, to) => f => { from.removeFeature(f); to.addFeature(f) }

    selected.forEach(feature => {
      feature.set('selected', true)
      move(featureSource, selectionSource)(feature)
    })

    deselected.forEach(feature => {
      move(selectionSource, featureSource)(feature)
      feature.unset('selected')
      feature.setStyle(null) // cache style with updated geometry.
    })
  })

  ;[select, modify].forEach(interaction => map.addInteraction(interaction))
}

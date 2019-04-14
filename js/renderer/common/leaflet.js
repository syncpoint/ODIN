/**
 * Expose more ES6 idiomatic Leaflet API.
 */

const { K } = require('../../shared/predef')

// layers :: L.Map -> [L.Layer]
const layers = map => {
  return K([])(layers => map.eachLayer(layer => layers.push(layer)))
}

/**
 * HTML `style` attributes for all matching layers (</div>) panes.
 * layerPanes :: (</div> a) => (L.Layer -> boolean) -> L.Map -> [a]
 */
const panes = predicate => map => layers(map)
  .filter(predicate)
  .map(layer => layer.getPane())

module.exports = {
  layers,
  panes
}

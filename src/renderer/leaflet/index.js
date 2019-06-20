import 'leaflet/dist/leaflet.css'
import 'leaflet.pm'
import 'leaflet.pm/dist/leaflet.pm.css'
import './leaflet-icons'
import './L.Area'
import './L.GeoJSON.Symbols'

import { K } from '../../shared/combinators'

// layers :: L.Map -> [L.Layer]
export const layers = map => {
  return K([])(layers => map.eachLayer(layer => layers.push(layer)))
}

/**
 * HTML `style` attributes for all matching layers (</div>) panes.
 * layerPanes :: (</div> a) => (L.Layer -> boolean) -> L.Map -> [a]
 */
export const panes = predicate => map => layers(map)
  .filter(predicate)
  .map(layer => layer.getPane())

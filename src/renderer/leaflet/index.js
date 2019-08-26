import 'leaflet/dist/leaflet.css'
import './leaflet-icons'
import './SVG'
import './geodesy'
import './Feature'
import './Polygon'
import './Polyline'
import './NamedArea'

import './Symbol'
import './Layer'
import './TACGRP/TACGRP.C2GM'

import { K } from '../../shared/combinators'

// layers :: L.Map -> [L.Layer]
export const layers = container => {
  return K([])(layers => container.eachLayer(layer => layers.push(layer)))
}

/**
 * HTML `style` attributes for all matching layers (</div>) panes.
 * layerPanes :: (</div> a) => (L.Layer -> boolean) -> L.Map -> [a]
 */
export const panes = predicate => map => layers(map)
  .filter(predicate)
  .map(layer => layer.getPane())

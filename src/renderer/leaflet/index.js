import 'leaflet/dist/leaflet.css'
import './handles.css'
import './leaflet-icons'
import './SVG'
import './geodesy'
import './Feature'
import './Symbol'
import './TACGRP/'

import { K } from '../../shared/combinators'

// layers :: L.Map -> [L.Layer]
export const layers = container => {
  return K([])(layers => container.eachLayer(layer => layers.push(layer)))
}

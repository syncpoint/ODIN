import 'leaflet/dist/leaflet.css'
import './leaflet-icons'
import './SVG'
import './geodesy'
import './Feature'
import './Polyline'

import './Symbol'
import './TACGRP/'

import './Shape'
import './Corridor2Point'

import { K } from '../../shared/combinators'

// layers :: L.Map -> [L.Layer]
export const layers = container => {
  return K([])(layers => container.eachLayer(layer => layers.push(layer)))
}

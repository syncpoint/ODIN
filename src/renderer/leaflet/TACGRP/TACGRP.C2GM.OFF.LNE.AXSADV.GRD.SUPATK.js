import L from 'leaflet'
import './Corridor'
import { corridorShape } from './shapes/OLAGS-'

/**
 *
 */
L.Feature['G*G*OLAGS-'] = L.TACGRP.Corridor.extend({
  _shape (group, options) {
    return corridorShape(group, options)
  }
})

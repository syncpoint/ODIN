import L from 'leaflet'
import './Corridor'
import { corridorShape } from './shapes/OLAGM-'

/**
 *
 */
L.Feature['G*G*OLAGM-'] = L.TACGRP.Corridor.extend({
  _shape (group, options) {
    return corridorShape(group, options)
  }
})

import L from 'leaflet'
import './Corridor'
import { corridorShape } from './shapes/K-----'

/**
 *
 */
L.Feature['G*G*K-----'] = L.TACGRP.Corridor.extend({
  _shape (group) {
    return corridorShape(group)
  }
})

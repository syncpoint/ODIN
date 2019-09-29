import L from 'leaflet'
import './Corridor'
import { corridorShape } from './shapes/OLAV--'

/**
 *
 */
L.Feature['G*G*OLAV--'] = L.TACGRP.Corridor.extend({
  _shape (group) {
    return corridorShape(group)
  }
})

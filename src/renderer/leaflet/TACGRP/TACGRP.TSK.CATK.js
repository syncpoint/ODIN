import L from 'leaflet'
import './Corridor'
import { corridorShape } from './shapes/K-----'

/**
 *
 */
L.Feature['G*T*K-----'] = L.TACGRP.Corridor.extend({
  _shape (group, options) {
    return corridorShape(group, options)
  }
})

import L from 'leaflet'
import './Corridor'
import { corridorShape } from './shapes/KF----'

/**
 *
 */
L.Feature['G*T*KF----'] = L.TACGRP.Corridor.extend({
  _shape (group, options) {
    return corridorShape(group, options)
  }
})

import L from 'leaflet'
import './Corridor'
import { corridorShape } from './shapes/KF----'

/**
 *
 */
L.Feature['G*T*KF----'] = L.TACGRP.Corridor.extend({
  _shape (group) {
    return corridorShape(group, this._shapeOptions)
  }
})

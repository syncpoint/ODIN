import L from 'leaflet'
import '../features/Corridor'

L.TACGRP.Corridor2Point = L.TACGRP.Corridor.extend({

  /**
   * Graphicsl editor is not to allow new points.
   */
  midways: false
})

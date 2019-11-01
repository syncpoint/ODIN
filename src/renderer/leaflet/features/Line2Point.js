import L from 'leaflet'
import './Polyline'

L.TACGRP.Line2Point = L.TACGRP.Polyline.extend({

  /**
   * Graphicsl editor is not to allow new points.
   */
  midways: false,
  lineSmoothing: false
})

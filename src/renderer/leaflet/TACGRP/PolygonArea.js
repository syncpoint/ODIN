import L from 'leaflet'
import * as math from 'mathjs'
import * as R from 'ramda'
import { toLatLngs, toGeometry } from '../GeoJSON'
import './Feature'
import { svgBuilder } from './shapes/svg-builder'
import { circularDoublyLinkedList } from '../../../shared/lists'
import { polyEditor } from './poly-editor'
import { stylesX } from './styles'


/**
 *
 */
const axisIntersect = (points, y, z) => R.aperture(2, points).reduce((acc, segment) => {
  const w = [segment[0].x, segment[0].y]
  const x = [segment[1].x, segment[1].y]
  const intersection = math.intersect(w, x, y, z)
  if (!intersection) return acc

  const point = L.point(intersection[0], intersection[1])
  if (L.bounds(segment).contains(point)) acc.push(point)
  return acc
}, [])


/**
 *
 */
const placements = ({ rings }) => {
  const ring = rings[0]
  const bounds = L.bounds(ring)
  const centroid = L.Point.centroid(ring)
  const placements = { center: centroid }

  const hIntersect = () => {
    const points = axisIntersect(ring, [bounds.min.x, centroid.y], [bounds.max.x, centroid.y])
    if (points.length !== 2) return {}
    return {
      east: points[0].x > points[1].x ? points[0] : points[1],
      west: points[0].x > points[1].x ? points[1] : points[0]
    }
  }

  const vIntersect = () => {
    const points = axisIntersect(ring, [centroid.x, bounds.min.y], [centroid.x, bounds.max.y])
    if (points.length !== 2) return {}
    return {
      north: points[0].y > points[1].y ? points[1] : points[0],
      south: points[0].y > points[1].y ? points[0] : points[1]
    }
  }

  // TODO: calculate axis intersections only when needed
  Object.entries(hIntersect()).forEach(([key, value]) => (placements[key] = value))
  Object.entries(vIntersect()).forEach(([key, value]) => (placements[key] = value))

  return placements
}


/**
 *
 */
L.TACGRP.PolygonArea = L.TACGRP.Feature.extend({


  /**
   * Project WGS84 geometry to pixel/layer coordinates.
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    this._shape.updateFrame({
      rings: this._rings.map(ring => ring.map(layerPoint))
    })
  },


  /**
   *
   */
  _editor () {
    const layer = new L.Feature.Handles().addTo(this._map)
    let current = this._rings[0]

    const callback = (channel, rings) => {
      switch (channel) {
        case 'drag': {
          this._rings = rings
          return this._project()
        }
        case 'dragend': {
          const geometry = toGeometry('Polygon', rings)
          return this.options.update({ geometry })
        }
      }
    }

    polyEditor(current, layer, circularDoublyLinkedList(), (channel, latlngs) => {
      current = latlngs
      callback(channel, [current])
    })

    return {
      dispose: () => this._map.removeLayer(layer)
    }
  },


  /**
   *
   */
  _setFeature (feature) {
    this._rings = toLatLngs(feature.geometry)
    this._shapeOptions = {
      interactive: this.options.interactive,
      lineSmoothing: this.options.lineSmoothing,
      styles: this.options.styles(feature),
      stylesX: stylesX(feature),
      labels: this.options.labels(feature)
    }
  },


  /**
   *
   */
  _shape (group, options) {
    return svgBuilder(group, options, {
      placements,
      points: ({ rings }) => rings,
      closed: () => true
    })
  }
})

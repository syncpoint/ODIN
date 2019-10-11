import L from 'leaflet'
import * as math from 'mathjs'
import * as R from 'ramda'
import { toLatLngs, toGeometry } from '../GeoJSON'
import '../features/Feature'
import { shape } from './shape'
import { polyEditor } from '../features/poly-editor'


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
    this._svg.updateFrame({
      rings: this._geometry.map(ring => ring.map(layerPoint))
    })
  },


  /**
   *
   */
  _geometryEditor () {
    const layer = new L.Handles().addTo(this._map)

    const options = {
      closed: true,
      midways: true
    }

    polyEditor(this._geometry[0], layer, options)((channel, latlngs) => {
      this._geometry = [latlngs]
      this._project()

      if (channel === 'dragend') {
        const geometry = toGeometry('Polygon', this._geometry)
        this.options.update({ geometry })
      }
    })

    return {
      dispose: () => this._map.removeLayer(layer)
    }
  },


  /**
   *
   */
  _setFeature (feature) {
    if (feature.geometry.type !== 'Polygon') {
      this._invalid = true
      console.log('unexpected geometry', feature)
      return
    }

    this._geometry = toLatLngs(feature.geometry)

    this._shapeOptions = {
      interactive: this.options.interactive,
      lineSmoothing: this.options.lineSmoothing,
      styles: this.options.styles(feature),
      labels: this.options.labels(feature)
    }
  },


  /**
   *
   */
  _shape (group, options) {
    return shape(group, options, {
      placements,
      points: ({ rings }) => rings,
      closed: () => true
    })
  }
})

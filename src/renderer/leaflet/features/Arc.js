import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { line } from './geo-helper'
import { styles } from '../features/styles'
import { FULCRUM } from './handle-types'
import { wrap360 } from '../geodesy'


/**
 *
 */
export const arcGeometry = (latlng, orientation, size, radius) => {

  const create = current => {
    const { latlng, orientation, size, radius } = current
    const normalizedOrientation = wrap360(orientation)

    return {
      copy: properties => create({ ...current, ...properties }),
      C: latlng,
      O: latlng.destinationPoint(radius, normalizedOrientation),
      S: latlng.destinationPoint(radius, normalizedOrientation + size),
      orientation: normalizedOrientation,
      size,
      radius,
      radians: {
        start: (normalizedOrientation - 90) / 180 * Math.PI,
        end: (normalizedOrientation - 90 + size) / 180 * Math.PI,
        delta: size / 180 * Math.PI
      }
    }
  }

  return create(({ latlng, orientation, size, radius }))
}


/**
 *
 */
L.TACGRP.Arc = L.TACGRP.Feature.extend({

  /**
   *
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    const C = layerPoint(this._geometry.C)
    const O = layerPoint(this._geometry.O)
    const S = layerPoint(this._geometry.S)

    this._frame = {
      C,
      O,
      S,
      radius: line([C, O]).d,
      radians: this._geometry.radians
    }
  },


  /**
   *
   */
  _geometryEditor () {
    const layer = new L.Handles().addTo(this._map)

    const handlers = {
      C: {
        latlng: arc => arc.C,
        arc: latlng => this._geometry.copy({ latlng })
      },
      O: {
        latlng: arc => arc.O,
        arc: latlng => this._geometry.copy({
          orientation: this._geometry.C.finalBearingTo(latlng),
          radius: this._geometry.C.distance(latlng)
        })
      },
      S: {
        latlng: arc => arc.S,
        arc: latlng => this._geometry.copy({
          orientation: this._geometry.C.finalBearingTo(latlng) - this._geometry.size,
          radius: this._geometry.C.distance(latlng)
        })
      }
    }

    const update = (channel, arc) => {
      this._geometry = arc
      this._reset()
      Object.keys(handlers).forEach(id => handles[id].setLatLng(arc[id]))

      if (channel === 'dragend') {
        const geometry = toGeometry('Point', arc.C)
        const properties = {
          geometry_max_range: arc.radius,
          geometry_orient_angle: arc.orientation
        }

        return this.options.update({ geometry, properties })
      }
    }

    const handles = Object.entries(handlers).reduce((acc, [id, handler]) => {
      const handleOptions = {
        type: FULCRUM,
        drag: ({ target }) => update('drag', handler.arc(target.getLatLng())),
        dragend: ({ target }) => update('dragend', handler.arc(target.getLatLng()))
      }

      const latlng = handler.latlng(this._geometry)
      acc[id] = layer.addHandle(latlng, handleOptions)
      return acc
    }, {})

    return {
      dispose: () => this._map.removeLayer(layer)
    }
  },


  /**
   *
   */
  _setFeature (feature) {
    const props = feature.properties
    const maxRange = props.geometry_max_range || props.fan_area_max_range_dim
    const orientAngle = props.geometry_orient_angle || props.fan_area_orient_angle
    const sizeAngle = props.geometry_size_angle || props.fan_area_sctr_size_angle

    this._geometry = arcGeometry(
      toLatLngs(feature.geometry),
      orientAngle,
      sizeAngle,
      maxRange
    )

    this._shapeOptions = {
      interactive: this.options.interactive,
      styles: (this.options.styles ? this.options.styles : styles)(feature),
      labels: (this.options.labels ? this.options.labels : () => [])(feature)
    }
  },

  // ==> Shape helpers.

  _arrow (p, delta, r) {
    return [
      L.point(
        p.x + Math.sin(-delta + 0.8 * Math.PI) * r,
        p.y + Math.cos(-delta + 0.8 * Math.PI) * r
      ),
      p,
      L.point(
        p.x + Math.sin(-delta - 0.8 * Math.PI) * r,
        p.y + Math.cos(-delta - 0.8 * Math.PI) * r
      )]
  },


  _cross (p, delta, r) {
    return [
      [
        L.point(
          p.x + Math.sin(delta + 0 * Math.PI) * r,
          p.y + Math.cos(delta + 0 * Math.PI) * r
        ),
        L.point(
          p.x + Math.sin(delta + 1 * Math.PI) * r,
          p.y + Math.cos(delta + 1 * Math.PI) * r
        )
      ],
      [
        L.point(
          p.x + Math.sin(delta + 0.5 * Math.PI) * r,
          p.y + Math.cos(delta + 0.5 * Math.PI) * r
        ),
        L.point(
          p.x + Math.sin(delta - 0.5 * Math.PI) * r,
          p.y + Math.cos(delta - 0.5 * Math.PI) * r
        )
      ]
    ]
  }

  // <== Shape helpers.
})

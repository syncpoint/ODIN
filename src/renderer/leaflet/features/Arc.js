import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { line } from './geo-helper'
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

    this._svg.updateFrame({
      C,
      O,
      S,
      radius: line([C, O]).d,
      radians: this._geometry.radians
    })
  },


  /**
   *
   */
  _geometryEditor () {
    const layer = new L.Handles().addTo(this._map)
    let current = this._geometry

    const handlers = {
      C: {
        latlng: arc => arc.C,
        arc: latlng => current.copy({ latlng })
      },
      O: {
        latlng: arc => arc.O,
        arc: latlng => current.copy({
          orientation: current.C.finalBearingTo(latlng),
          radius: current.C.distance(latlng)
        })
      },
      S: {
        latlng: arc => arc.S,
        arc: latlng => current.copy({
          orientation: current.C.finalBearingTo(latlng) - current.size,
          radius: current.C.distance(latlng)
        })
      }
    }

    const update = (channel, arc) => {
      this._geometry = current = arc
      this._project()
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

      const latlng = handler.latlng(current)
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
    /* eslint-disable camelcase */
    const { geometry_max_range, geometry_orient_angle, geometry_size_angle } = feature.properties

    this._geometry = arcGeometry(
      toLatLngs(feature.geometry),
      geometry_orient_angle,
      geometry_size_angle,
      geometry_max_range
    )

    this._shapeOptions = {
      interactive: this.options.interactive,
      labels: this._labels(),
      styles: this._styles(feature)
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

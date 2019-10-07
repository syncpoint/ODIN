import L from 'leaflet'
import * as R from 'ramda'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { line, arc } from './shapes/geo-helper'
import { FULCRUM } from './handle-types'
import './Feature'
import { wrap360 } from '../geodesy'
import { shape } from './shapes/shape'


/**
 *
 */
export const seizeGeometry = (latlng, orientation, rangeMin, rangeMax) => {

  const create = current => {
    const { latlng, orientation, rangeMin, rangeMax } = current
    const normalizedOrientation = wrap360(orientation)

    return {
      copy: properties => create({ ...current, ...properties }),
      C: latlng,
      O: latlng.destinationPoint(rangeMin, normalizedOrientation),
      S: latlng.destinationPoint(rangeMax, normalizedOrientation + 90),
      orientation: normalizedOrientation,
      size: 90,
      rangeMin,
      rangeMax
    }
  }

  return create(({ latlng, orientation, rangeMin, rangeMax }))
}


/**
 *
 */
L.Feature['G*T*Z-----'] = L.TACGRP.Feature.extend({


  /**
   *
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    const C = layerPoint(this._seize.C)
    const O = layerPoint(this._seize.O)
    const S = layerPoint(this._seize.S)

    this._shape.updateFrame({
      C,
      O,
      S,
      orientation: this._seize.orientation,
      rangeMin: line([C, S]).d,
      rangeMax: line([C, O]).d
    })
  },


  /**
   *
   */
  _editor () {
    const layer = new L.Feature.Handles().addTo(this._map)
    let current = this._seize

    const handlers = {
      C: {
        latlng: arc => arc.C,
        seize: latlng => current.copy({ latlng })
      },
      O: {
        latlng: arc => arc.O,
        seize: latlng => current.copy({
          orientation: current.C.finalBearingTo(latlng),
          rangeMin: Math.min(current.C.distance(latlng), current.rangeMax)
        })
      },
      S: {
        latlng: arc => arc.S,
        seize: latlng => current.copy({
          orientation: current.C.finalBearingTo(latlng) - 90,
          rangeMax: Math.max(current.C.distance(latlng), current.rangeMin)
        })
      }
    }

    const update = (channel, seize) => {
      this._seize = current = seize
      this._project()
      Object.keys(handlers).forEach(id => handles[id].setLatLng(seize[id]))

      if (channel === 'dragend') {
        const geometry = toGeometry('Point', seize.C)
        const properties = {
          geometry_mnm_range: seize.rangeMin,
          geometry_max_range: seize.rangeMax,
          geometry_orient_angle: seize.orientation
        }

        return this.options.update({ geometry, properties })
      }
    }

    const handles = Object.entries(handlers).reduce((acc, [id, handler]) => {
      const handleOptions = {
        type: FULCRUM,
        drag: ({ target }) => update('drag', handler.seize(target.getLatLng())),
        dragend: ({ target }) => update('dragend', handler.seize(target.getLatLng()))
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
    const { geometry_max_range, geometry_mnm_range, geometry_orient_angle } = feature.properties

    this._seize = seizeGeometry(
      toLatLngs(feature.geometry),
      geometry_orient_angle,
      geometry_mnm_range,
      geometry_max_range
    )

    this._shapeOptions = {
      interactive: this.options.interactive,
      labels: this._labels(),
      styles: this._styles(feature)
    }
  },


  /**
   *
   */
  _shape (group, options) {
    return shape(group, options, {
      points: ({ C, O, S, orientation, rangeMin, rangeMax }) => {
        const steps = 32

        const xs = R.range(0, steps + 1)
          .map(i => orientation - 90 + i * 90 / 32)
          .map(deg => deg / 180 * Math.PI)

        const ys = R.range(0, steps + 1)
          .map(i => i * 360 / 32)
          .map(deg => deg / 180 * Math.PI)

        const radius = (rangeMax - rangeMin) / 2
        const CC = line([C, O]).translate(radius).point(1.0)
        const ALa = line([C, line([C, S]).point(rangeMax / rangeMin)])
        const ALb = ALa.translate(-0.1 * rangeMin)

        return [
          [...arc(C, rangeMax)(xs)],
          [...arc(CC, radius)(ys)],
          [ALb.point(0.9), ALa.point(1.0), ALb.point(1.1)]
        ]
      }
    })
  }
})

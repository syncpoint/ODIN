import L from 'leaflet'
import * as R from 'ramda'
import '../features/Feature'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { line, arc } from '../features/geo-helper'
import { FULCRUM } from '../features/handle-types'
import { wrap360 } from '../geodesy'
import { shape } from '../features/react-shape'
import { styles } from '../features/styles'


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

const SZE = L.TACGRP.Feature.extend({


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
      orientation: this._geometry.orientation,
      rangeMin: line([C, S]).d,
      rangeMax: line([C, O]).d
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
        seize: latlng => this._geometry.copy({ latlng })
      },
      O: {
        latlng: arc => arc.O,
        seize: latlng => this._geometry.copy({
          orientation: this._geometry.C.finalBearingTo(latlng),
          rangeMin: Math.min(this._geometry.C.distance(latlng), this._geometry.rangeMax)
        })
      },
      S: {
        latlng: arc => arc.S,
        seize: latlng => this._geometry.copy({
          orientation: this._geometry.C.finalBearingTo(latlng) - 90,
          rangeMax: Math.max(this._geometry.C.distance(latlng), this._geometry.rangeMin)
        })
      }
    }

    const update = (channel, seize) => {
      this._geometry = seize
      this._reset()
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
    const orientAngle = props.geometry_orient_angle || props.fan_area_orient_angle
    const mnmRange = props.geometry_mnm_range || props.fan_area_mnm_range_dim
    const maxRange = props.geometry_max_range || props.fan_area_max_range_dim

    this._geometry = seizeGeometry(
      toLatLngs(feature.geometry),
      orientAngle,
      mnmRange,
      maxRange
    )

    this._shapeOptions = {
      interactive: this.options.interactive,
      labels: () => [],
      styles: styles(feature)
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


/**
 *
 */
L.Feature['G*T*Z-----'] = (feature, options) => new SZE(feature, options)

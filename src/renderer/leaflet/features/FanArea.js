import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { line } from './geo-helper'
import { FULCRUM } from './handle-types'
import { wrap360 } from '../geodesy'
import { shape } from './shape'


/**
 *
 */
export const fanGeometry = (latlng, orientation, size, rangeO, rangeS) => {

  const create = current => {
    const { latlng, orientation, size, rangeO, rangeS } = current
    const normalizedOrientation = wrap360(orientation)
    const normalizedSize = wrap360(size)

    return {
      copy: properties => create({ ...current, ...properties }),
      C: latlng,
      O: latlng.destinationPoint(rangeO, normalizedOrientation),
      S: latlng.destinationPoint(rangeS, normalizedOrientation + normalizedSize),
      orientation: normalizedOrientation,
      size: normalizedSize,
      rangeO,
      rangeS
    }
  }

  return create(({ latlng, orientation, size, rangeO, rangeS }))
}


/**
 *
 */
L.TACGRP.FanArea = L.TACGRP.Feature.extend({

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
      size: this._geometry.size,
      rangeO: line([C, O]).d,
      rangeS: line([C, S]).d
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
          rangeO: this._geometry.C.distance(latlng)
        })
      },
      S: {
        latlng: arc => arc.S,
        arc: latlng => this._geometry.copy({
          size: this._geometry.C.finalBearingTo(latlng) - this._geometry.orientation,
          rangeS: this._geometry.C.distance(latlng)
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
          geometry_mnm_range: arc.rangeO,
          geometry_max_range: arc.rangeS,
          geometry_orient_angle: arc.orientation,
          geometry_size_angle: arc.size
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
    /* eslint-disable camelcase */
    const { geometry_max_range, geometry_mnm_range, geometry_orient_angle, geometry_size_angle } = feature.properties

    this._geometry = fanGeometry(
      toLatLngs(feature.geometry),
      geometry_orient_angle,
      geometry_size_angle,
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
    options.styles.clipping = 'mask'

    return shape(group, options, {
      points: ({ C, O, S, rangeS, rangeO }) => {
        const LCO = line([C, O])
        const LCS = line([C, S])
        const LOR = LCO.translate(rangeO / 20)
        const LOL = LCO.translate(-rangeO / 20)
        const LSR = LCS.translate(rangeS / 20)
        const LSL = LCS.translate(-rangeS / 20)

        return [
          [C, LOL.point(0.55), LOR.point(0.45), O],
          [C, LSR.point(0.55), LSL.point(0.45), S],
          [LOR.point(0.9), O, LOL.point(0.9)],
          [LSR.point(0.9), S, LSL.point(0.9)]
        ]
      }
    })
  },

  _labelText: 'C',

  /**
   *
   */
  _labels () {
    return [{
      placement: ({ C, O, rangeO }) => line([C, line([C, O]).translate(-rangeO / 20).point(0.55)]).point(0.3),
      lines: [this._labelText],
      'font-size': 18,
      angle: ({ orientation }) => orientation - 90
    },
    {
      placement: ({ C, S, rangeS }) => line([C, line([C, S]).translate(rangeS / 20).point(0.55)]).point(0.3),
      lines: [this._labelText],
      'font-size': 18,
      angle: ({ orientation, size }) => orientation + size - 90
    }]
  }
})

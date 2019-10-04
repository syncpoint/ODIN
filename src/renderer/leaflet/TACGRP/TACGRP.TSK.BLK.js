/* eslint-disable */

import L from 'leaflet'
import { elementCache, noop } from './shapes/common'
import { K } from '../../../shared/combinators'
import '../Corridor2Point'
import './Corridor'

/**
 * OPTIONS:
 * - interactive (static for now)
 * - clipping (static)
 * - line smoothing (dynamic)
 * -
 * - paths are identitfied by name
 * - functions provide style for path
 * - clipping strategy is static and connot be changed
 * -
 *
 * COMMANDS:
 * - updateStyles()
 * - updateLabels()
 * - updateGeometry()
 */
export const svgBuilder = (options, callbacks) => {
  const state = { attached: false }
  const cache = elementCache()
  const paths = []
  const path = name => paths.push(name)
  const interactive = options.interactive
    ? element => K(element)(element => L.DomUtil.addClass(element, 'leaflet-interactive'))
    : element => element

  const attach = group => {
    paths
      .map(name => cache.put(name, L.SVG.path(callbacks.pathStyle(name)))(noop))
      .map(path => interactive(path))
      .forEach(path => group.appendChild(path))

    state.attached = true
    if (state.frame) updateFrame(state.frame)
  }

  const updateFrame = frame => {
    state.frame = frame
    if (!state.attached) return
    const { points, closed } = callbacks.points(frame)
    const d = L.SVG.pointsToPath(points, closed)
    paths.forEach(name => cache.element(name).setAttribute('d', d))
  }

  return {
    path,
    attach,
    updateFrame
  }
}

L.Feature['G*T*B-----'] = L.TACGRP.Corridor.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    options.styles.clipping = 'mask'

    const points = ({ center, envelope }) => ({ points: [center, envelope[0]], closed: false })
    const pathStyle = name => options.stylesX[name]

    const builder = svgBuilder(options, {
      points,
      pathStyle
    })

    builder.path('outline')
    builder.path('path')

    return {
      attached: () => builder.attach(group),
      updateFrame: builder.updateFrame
    }
  }
})

// L.Feature['G*T*B-----'] = L.Corridor2Point.extend({
//   path ({ A, B, B1, B2 }) {
//     return [[A, B], [B1, B2]]
//   },
//   label ({ A, B, initialBearing }) {
//     const distance = A.distanceTo(B)
//     const latlng = A.destinationPoint(distance / 2, initialBearing)
//     return { text: 'B', latlng, bearing: initialBearing }
//   }
// })

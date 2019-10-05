/* eslint-disable */
import L from 'leaflet'
import uuid from 'uuid-random'
import * as math from 'mathjs'
import * as R from 'ramda'
import { elementCache, noop, clippingStrategy } from './common'
import { svgBuilder } from './svg-builder'

const DEFAULT_FONT_SIZE = 14

const axisIntersect = (points, y, z) => R.aperture(2, points).reduce((acc, segment) => {
  const w = [segment[0].x, segment[0].y]
  const x = [segment[1].x, segment[1].y]
  const intersection = math.intersect(w, x, y, z)
  if (!intersection) return acc

  const point = L.point(intersection[0], intersection[1])
  if (L.bounds(segment).contains(point)) acc.push(point)
  return acc
}, [])

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

export const polygonShape = (group, options) => {
  const state = { options }

  const builder = svgBuilder(options, {
    placements,
    points: ({ rings }) => ({ points: rings, closed: true }),
    style: name => state.options.stylesX[name],
    labels: () => state.options.labels
  })

  builder.path('outline')
  builder.path('path')

  return {
    attached: () => builder.attach(group),
    updateFrame: builder.updateFrame,
    updateOptions: options => {
      state.options = options
      builder.refresh()
    }
  }
}



// const textAnchor = alignment => {
//   switch (alignment) {
//     case 'left': return 'start'
//     case 'right': return 'end'
//     case 'center': return 'middle'
//     default: return 'middle'
//   }
// }


// /**
//  *
//  */
// const renderLabels = (cache, clipping, labels, rings) => {
//   const placement = labelPositions(rings[0])

//   // Don't display labels for 'small' areas.
//   const area = Math.abs(L.Point.area(rings[0]))
//   if (area < 100000) labels = []

//   const text = label => L.SVG.text({
//     'font-size': label.fontSize,
//     'text-anchor': textAnchor(label.alignment),
//     'alignment-baseline': 'central',
//     y: placement[label.placement].y
//   })

//   const tspan = label => L.SVG.tspan({
//     dy: '1.2em',
//     'text-anchor': textAnchor(label.alignment),
//     'alignment-baseline': 'central'
//   })

//   cache.put('labels', L.SVG.create('g'))(element => cache.element('group').removeChild(element))
//   cache.element('group').appendChild(cache.element('labels'))

//   labels.forEach(descriptor => {
//     descriptor.fontSize = descriptor.fontSize || DEFAULT_FONT_SIZE

//     const label = text(descriptor)

//     const textElement = index => index
//       ? label.appendChild(tspan(descriptor))
//       : label

//     descriptor.lines.filter(line => line).forEach((line, index) => {
//       const element = textElement(index)

//       const match = line.match(/<bold>(.*)<\/bold>/)
//       const bold = (match && !!match[1]) || false
//       element.textContent = bold ? match[1] : line
//       element.setAttribute('x', placement[descriptor.placement].x)
//       element.setAttribute('font-weight', bold ? 'bold' : 'normal')
//     })

//     // Move whole label into place.
//     // Bounding box is only available AFTER text
//     // was added to a live SVG parent element.
//     cache.element('labels').appendChild(label)

//     const box = label.getBBox()
//     const ty = descriptor.fontSize / 2 - box.height / 2
//     const tx = descriptor.alignment === 'left'
//       ? -box.width / 2
//       : descriptor.alignment === 'right'
//         ? box.width / 2
//         : 0

//     // Note: Label's bounding box (bbox) does NOT move with transformation.
//     label.setAttribute('transform', `translate(${tx} ${ty})`)
//     clipping.withLabel(label, tx, ty)
//   })
// }


// /**
//  *
//  */
// const renderPath = (cache, rings, lineSmoothing) => {
//   const d = L.SVG.pointsToPath([rings[0]], true, !!lineSmoothing)
//   cache.element('outline').setAttribute('d', d)
//   cache.element('path').setAttribute('d', d)
// }

// export const polygonShape = (group, options) => {

//   const isAttached = () => group.parentNode

//   // Mutable state:
//   const current = { options }
//   const rings = () => current.rings
//   const styles = () => current.options.styles
//   const labels = () => current.options.labels
//   const lineSmoothing = () => current.options.lineSmoothing
//   const interactive = () => current.options.interactive

//   const cache = elementCache()

//   cache.put('group', group)(noop)
//   cache.put('defs', L.SVG.create('defs'))(noop)
//   cache.put('labels', L.SVG.create('g'))(element => cache.element('group').removeChild(element))

//   cache.element('group').appendChild(cache.element('defs'))
//   cache.element('group').appendChild(cache.element('labels'))

//   // Transparent path to increase clickable area:
//   cache.put('outline', L.SVG.path({
//     'stroke-width': 7,
//     stroke: 'black',
//     'stroke-linejoin': 'round',
//     fill: 'none'
//   }))(noop)

//   cache.put('path', L.SVG.path({}))(noop)

//   if (interactive()) {
//     L.DomUtil.addClass(cache.element('outline'), 'leaflet-interactive')
//     L.DomUtil.addClass(cache.element('path'), 'leaflet-interactive')
//   }

//   cache.element('group').appendChild(cache.element('outline'))
//   cache.element('group').appendChild(cache.element('path'))

//   const clipping = clippingStrategy(styles().clipping)(cache)

//   const updateOptions = options => {
//     clipping.reset()
//     current.options = options

//     L.SVG.setAttributes(cache.element('path'))({
//       'stroke-width': styles().strokeWidth,
//       'stroke-dasharray': styles().strokeDashArray,
//       'stroke-linejoin': 'round',
//       stroke: styles().stroke,
//       'fill-opacity': styles().fillOpacity
//     })

//     clipping.withPath(cache.element('outline'))
//     clipping.withPath(cache.element('path'))

//     if (styles().fill === 'diagonal') {
//       const patternId = `pattern-${uuid()}`
//       cache.put('pattern', L.SVG.diagonalPattern(patternId, styles()))(element => {
//         cache.element('defs').removeChild(element)
//       })

//       cache.element('defs').appendChild(cache.element('pattern'))
//       cache.element('path').setAttribute('fill', `url(#${patternId})`)
//     } else {
//       cache.element('path').setAttribute('fill', styles().fill)
//     }

//     // Only update labels if geometry was aready supplied:
//     if (rings()) renderLabels(cache, clipping, labels(), rings())
//   }


//   const updateFrame = frame => {
//     current.rings = frame.rings
//     // Just buffer rings until we are attached to DOM.
//     if (!isAttached()) return

//     clipping.reset()
//     renderLabels(cache, clipping, labels(), rings())
//     renderPath(cache, rings(), lineSmoothing())
//     clipping.finish()
//   }

//   const attached = () => {
//     // Now, group is registered with DOM.
//     updateOptions(options)
//     updateFrame({ rings: rings() })
//   }

//   return {
//     updateFrame,
//     updateOptions,
//     attached
//   }
// }

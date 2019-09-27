import L from 'leaflet'
import uuid from 'uuid-random'
import * as math from 'mathjs'
import * as R from 'ramda'
import { maskClipping, backdropClipping, noClipping } from './polygon-clipping'

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

const textAnchor = alignment => {
  switch (alignment) {
    case 'left': return 'start'
    case 'right': return 'end'
    case 'center': return 'middle'
    default: return 'middle'
  }
}

const labelPositions = ring => {
  const bounds = L.bounds(ring)
  const centroid = L.Point.centroid(ring)
  const placement = { center: centroid }

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
  Object.entries(hIntersect()).forEach(([key, value]) => (placement[key] = value))
  Object.entries(vIntersect()).forEach(([key, value]) => (placement[key] = value))

  return placement
}

const elementCache = () => {
  const cache = {}

  const put = (id, element) => dispose => {
    cache[id] && cache[id].dispose(cache[id].element)
    cache[id] = { element, dispose }
    return element
  }

  const element = id => cache[id].element
  const dispose = () => Object.values(cache).forEach(({ element, dispose }) => dispose(element))
  return { put, element, dispose }
}

const noop = () => { }

const clippingStrategy = clipping => cache => {
  switch (clipping) {
    case 'mask': return maskClipping(cache)
    case 'backdrop': return backdropClipping(cache)
    default: return noClipping(cache)
  }
}

const renderLabels = (cache, clipping, labels, points) => {
  const placement = labelPositions(points[0])

  // Don't display labels for 'small' areas.
  const area = Math.abs(L.Point.area(points[0]))
  if (area < 100000) labels = []

  const text = label => L.SVG.text({
    'font-size': label.fontSize,
    'text-anchor': textAnchor(label.alignment),
    'alignment-baseline': 'central',
    y: placement[label.placement].y
  })

  const tspan = label => L.SVG.tspan({
    dy: '1.2em',
    'text-anchor': textAnchor(label.alignment),
    'alignment-baseline': 'central'
  })

  cache.put('labels', L.SVG.create('g'))(element => cache.element('group').removeChild(element))
  cache.element('group').appendChild(cache.element('labels'))

  labels.forEach(descriptor => {
    descriptor.fontSize = descriptor.fontSize || DEFAULT_FONT_SIZE

    const label = text(descriptor)

    const textElement = index => index
      ? label.appendChild(tspan(descriptor))
      : label

    descriptor.lines.filter(line => line).forEach((line, index) => {
      const element = textElement(index)

      const match = line.match(/<bold>(.*)<\/bold>/)
      const bold = (match && !!match[1]) || false
      element.textContent = bold ? match[1] : line
      element.setAttribute('x', placement[descriptor.placement].x)
      element.setAttribute('font-weight', bold ? 'bold' : 'normal')
    })

    // Move whole label into place.
    // Bounding box is only available AFTER text
    // was added to a live SVG parent element.
    cache.element('labels').appendChild(label)

    const box = label.getBBox()
    const ty = descriptor.fontSize / 2 - box.height / 2
    const tx = descriptor.alignment === 'left'
      ? -box.width / 2
      : descriptor.alignment === 'right'
        ? box.width / 2
        : 0

    // Note: Label's bounding box (bbox) does NOT move with transformation.
    label.setAttribute('transform', `translate(${tx} ${ty})`)
    clipping.withLabel(label, tx, ty)
  })
}

const renderPath = (cache, points, smoothing) => {
  const d = L.SVG.pointsToPath(points, true, !!smoothing)
  cache.element('margin').setAttribute('d', d)
  cache.element('outline').setAttribute('d', d)
  cache.element('path').setAttribute('d', d)
}

export default (renderer, points, options) => {
  const cache = elementCache()

  cache.put('root', renderer._rootGroup)(noop)
  cache.put('group', L.SVG.create('g'))(element => cache.element('root').removeChild(element))
  cache.put('defs', L.SVG.create('defs'))(noop)
  cache.put('labels', L.SVG.create('g'))(element => cache.element('group').removeChild(element))

  cache.element('group').appendChild(cache.element('defs'))
  cache.element('group').appendChild(cache.element('labels'))

  const clipping = clippingStrategy(options.styles.clipping)(cache)

  // Transparent path to increase clickable area:
  cache.put('margin', L.SVG.path({ 'stroke-width': 12, stroke: 'yellow', fill: 'none', 'opacity': 0.0, 'stroke-linejoin': 'round' }))(noop)
  // make lines have a small black outline in order to increase contrast:
  cache.put('outline', L.SVG.path({ 'stroke-width': 6, stroke: 'black', fill: 'none', 'opacity': 1.0 }))(noop)
  cache.put('path', L.SVG.path({}))(noop)

  if (options.interactive) {
    L.DomUtil.addClass(cache.element('margin'), 'leaflet-interactive')
    L.DomUtil.addClass(cache.element('outline'), 'leaflet-interactive')
    L.DomUtil.addClass(cache.element('path'), 'leaflet-interactive')
  }

  cache.element('group').appendChild(cache.element('margin'))
  cache.element('group').appendChild(cache.element('outline'))
  cache.element('group').appendChild(cache.element('path'))
  cache.element('root').appendChild(cache.element('group'))

  const dispose = () => cache.dispose()

  // Closure over styles, labels and points.
  const create = ({ styles, labels, points }) => {

    const updatePoints = (points, smoothing) => {
      clipping.reset()
      renderLabels(cache, clipping, labels, points)
      renderPath(cache, points, smoothing)
      clipping.finish()
      return create({ styles, labels, points })
    }

    const updateLabels = labels => {
      renderLabels(cache, clipping, labels, points)
      return create({ styles, labels, points })
    }

    const updateStyles = styles => {
      L.SVG.setAttributes(cache.element('path'))({
        'stroke-width': styles.strokeWidth,
        'stroke-dasharray': styles.strokeDashArray,
        stroke: styles.stroke,
        'fill-opacity': styles.fillOpacity,
        'stroke-linejoin': 'round'
      })

      /* TODO: check if the other style params are required too */
      L.SVG.setAttributes(cache.element('outline'))({
        'stroke-dasharray': styles.strokeDashArray,
        'stroke-linejoin': 'round'
      })

      clipping.withPath(cache.element('path'))
      clipping.withPath(cache.element('outline'))

      if (styles.fill === 'diagonal') {
        const patternId = `pattern-${uuid()}`
        cache.put('pattern', L.SVG.diagonalPattern(patternId, styles))(element => {
          cache.element('defs').removeChild(element)
        })

        cache.element('defs').appendChild(cache.element('pattern'))
        cache.element('path').setAttribute('fill', `url(#${patternId})`)
      } else {
        cache.element('path').setAttribute('fill', styles.fill)
      }

      return create({ styles, labels, points })
    }

    return {
      dispose,
      updatePoints,
      updateStyles,
      updateLabels,
      // We must expose group element to handle interactive targets on layer.
      element: cache.element('group')
    }
  }

  return create({ styles: options.styles, labels: options.labels, points })
}

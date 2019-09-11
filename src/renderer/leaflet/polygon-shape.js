import L from 'leaflet'
import uuid from 'uuid-random'
import * as math from 'mathjs'
import * as R from 'ramda'
import { maskClipping } from './polygon-clipping'

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

export default (renderer, options) => {
  const elementCache = {}
  const cache = (id, element) => dispose => {
    elementCache[id] && elementCache[id]()
    elementCache[id] = dispose
    return element
  }

  const group = L.SVG.create('g')
  const defs = L.SVG.create('defs')
  group.appendChild(defs)
  const clipping = maskClipping(group, defs)

  // Transparent path to increase clickable area:
  const outlinePath = L.SVG.path({ 'stroke-width': 10, stroke: 'red', fill: 'none', 'opacity': 0.0 })
  const linePath = L.SVG.path({ })
  const labels = {}

  if (options.interactive) {
    L.DomUtil.addClass(outlinePath, 'leaflet-interactive')
    L.DomUtil.addClass(linePath, 'leaflet-interactive')
  }

  group.appendChild(outlinePath)
  group.appendChild(linePath)
  renderer._rootGroup.appendChild(group)

  const dispose = () => {
    renderer._rootGroup.removeChild(group)
  }

  const updateLayerPoints = (layerPoints, smoothing) => {
    clipping.reset()
    Object.values(labels).forEach(label => group.removeChild(label))
    const placement = labelPositions(layerPoints[0])

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

    options.labels.forEach(label => {
      label.fontSize = label.fontSize || 16
      labels[label.placement] = text(label)

      const textElement = index => index
        ? labels[label.placement].appendChild(tspan(label))
        : labels[label.placement]

      label.lines.forEach((line, index) => {
        const element = textElement(index)
        const match = line.match(/<bold>(.*)<\/bold>/)
        const bold = (match && !!match[1]) || false
        element.textContent = bold ? match[1] : line
        element.setAttribute('x', placement[label.placement].x)
        element.setAttribute('font-weight', bold ? 'bold' : 'normal')
      })

      // Move whole label into place.
      // Bounding box is only available AFTER text
      // was added to a live SVG parent element.
      group.appendChild(labels[label.placement])

      const box = labels[label.placement].getBBox()
      const ty = label.fontSize / 2 - box.height / 2
      const tx = label.alignment === 'left'
        ? -box.width / 2
        : label.alignment === 'right'
          ? box.width / 2
          : 0

      // Note: Label's bounding box (bbox) does NOT move with transformation.
      labels[label.placement].setAttribute('transform', `translate(${tx} ${ty})`)
      clipping.withLabel(labels[label.placement], tx, ty)
    })

    // <= labels

    const d = L.SVG.pointsToPath(layerPoints, true, !!smoothing)
    outlinePath.setAttribute('d', d)
    linePath.setAttribute('d', d)
    clipping.finish()
  }

  const updateStyles = styles => {
    L.SVG.setAttributes(linePath)({
      'stroke-width': styles.strokeWidth,
      'stroke-dasharray': styles.strokeDashArray,
      stroke: styles.stroke,
      'fill-opacity': styles.fillOpacity,
      'stroke-linejoin': 'round'
    })

    clipping.withPath(linePath)

    if (styles.fill === 'diagonal') {
      const patternId = `pattern-${uuid()}`
      const pattern = cache('pattern', L.SVG.diagonalPattern(patternId, styles))(() => defs.removeChild(pattern))
      defs.appendChild(pattern)
      linePath.setAttribute('fill', `url(#${patternId})`)
    } else {
      linePath.setAttribute('fill', styles.fill)
    }
  }

  return {
    dispose,
    updateLayerPoints,
    updateStyles,
    // We must expose group element to handle interactive targets on layer.
    element: group
  }
}

import L from 'leaflet'
import uuid from 'uuid-random'
import { K } from '../../../shared/combinators'
import { clippingStrategy } from './clipping'
import { noop, elementCache } from './cache'

const DEFAULT_FONT_SIZE = 14

const textAnchor = (descriptor, angle) => {
  if (angle < 90 || angle > 270) return descriptor.anchor
  switch (descriptor.anchor) {
    case 'start': return 'end'
    case 'end' : return 'start'
    default: return descriptor.anchor
  }
}

const text = (descriptor, angle) => {


  return L.SVG.text({
    'font-size': descriptor['font-size'],
    'text-anchor': textAnchor(descriptor, angle) || 'middle',
    'alignment-baseline': 'central'
  })
}

const tspan = () => L.SVG.tspan({
  dy: '1.2em',
  'alignment-baseline': 'central'
})


/**
 * TODO: move callbacks to options
 * TODO: consider using <use/> for path
 * TODO: setup and use 'global' fill patterns
 */
export const shape = (group, options, callbacks) => {
  const state = { attached: false, options }
  const cache = elementCache()
  const removeChild = parent => element => cache.element(parent).removeChild(element)

  const style = name => {
    const pathStyles = state.options.styles[name]

    // Create fill pattern if necessary.
    // NOTE: Only 'path' can use fill pattern at the moment.
    if (name === 'path' && options.styles.fill === 'diagonal') {
      const patternId = `pattern-${uuid()}`
      const pattern = L.SVG.diagonalPattern(patternId, pathStyles)
      cache.put('pattern', pattern)(removeChild('defs'))
      cache.element('defs').appendChild(pattern)
      pathStyles.fill = `url(#${patternId})`
    }

    return pathStyles
  }

  const labels = () => callbacks.labels
    ? callbacks.labels(state.frame)
    : (typeof state.options.labels) === 'function'
      ? state.options.labels(state.frame)
      : state.options.labels

  cache.put('group', group)(noop)
  cache.put('defs', L.SVG.create('defs'))(noop)
  cache.element('group').appendChild(cache.element('defs'))

  const clipping = clippingStrategy(options.styles.clipping)(cache)
  const paths = (callbacks.paths && callbacks.paths()) || [ 'outline', 'contrast', 'path' ]

  const interactive = options.interactive
    ? element => K(element)(element => L.DomUtil.addClass(element, 'leaflet-interactive'))
    : element => element


  /**
   *
   */
  const textLabel = (center, angle, descriptor) => {
    const fontSize = descriptor['font-size'] || DEFAULT_FONT_SIZE

    const label = text(descriptor, angle)
    label.setAttribute('y', center.y)

    const textElement = index => index
      ? label.appendChild(tspan())
      : label

    descriptor.lines.filter(line => line).forEach((line, index) => {
      const element = textElement(index)
      const match = line.match(/<bold>(.*)<\/bold>/)
      const bold = (match && !!match[1]) || false
      element.textContent = bold ? match[1] : line
      element.setAttribute('x', center.x)
      element.setAttribute('font-weight', bold ? 'bold' : 'normal')
    })

    cache.element('labels').appendChild(label)

    // Move label into place (with optional rotation).

    const box = label.getBBox()
    const ty = fontSize / 2 - box.height / 2
    const tx = descriptor.anchor === 'left'
      ? -box.width / 2
      : descriptor.anchor === 'right'
        ? box.width / 2
        : 0

    // NOTE: Same transformation is used for backdrop/clip mask.
    const flip = (angle > 90 && angle < 270) ? -1 : 1
    const transform = `
      translate(${center.x + tx} ${center.y + ty})
      rotate(${angle})
      scale(${flip} ${flip})
      translate(${-center.x} ${-center.y})
    `

    label.setAttribute('transform', transform)
    return label
  }


  /**
   *
   */
  const glyphLabel = (center, angle, descriptor) => {
    const label = descriptor.glyph
    cache.element('labels').appendChild(label)

    const transform = `
      translate(${center.x} ${center.y})
      rotate(${angle})
      scale(${descriptor.scale})
      translate(${descriptor.offset.x} ${descriptor.offset.y})
    `

    label.setAttribute('transform', transform)
    return label
  }


  /**
   *
   */
  const renderLabels = () => {
    clipping.reset()

    if (state.options.hideLabels) return clipping.finish()
    cache.put('labels', L.SVG.create('g'))(removeChild('group'))
    cache.element('group').appendChild(cache.element('labels'))

    const placements = callbacks.placements && callbacks.placements(state.frame)
    ;(labels() || []).forEach(descriptor => {

      // angle: either literal or function:
      const angle = typeof descriptor.angle === 'function'
        ? descriptor.angle(state.frame)
        : descriptor.angle || 0

      // placement: either literal, function or L.Point:
      const center = {
        'function': p => p(state.frame),
        'string': p => placements[p],
        'object': p => p
      }[typeof descriptor.placement](descriptor.placement)

      // Precede only when position is defined.
      if (!center) return

      // Label is either text lines or a glyph:
      const label = descriptor.lines
        ? textLabel(center, angle, descriptor)
        : glyphLabel(center, angle, descriptor)

      clipping.withLabel(label)
    })

    clipping.finish()
  }


  /**
   *
   */
  const attached = () => {
    paths
      .map(name => cache.put(name, L.SVG.path(style(name)))(noop))
      .map(path => interactive(path))
      .map(path => clipping.withPath(path))
      .forEach(path => group.appendChild(path))

    state.attached = true
    if (state.frame) updateFrame(state.frame)
  }


  /**
   *
   */
  const updateFrame = frame => {
    state.frame = frame
    if (!state.attached) return
    const closed = callbacks.closed && callbacks.closed()
    const d = L.SVG.pointsToPath(callbacks.points(frame), closed, state.options.lineSmoothing)
    paths.forEach(name => cache.element(name).setAttribute('d', d))
    renderLabels()
  }


  /**
   *
   */
  const updateOptions = options => {
    state.options = options
    paths.forEach(name => L.SVG.setAttributes(cache.element(name))(style(name)))
    renderLabels()
  }

  return {
    attached,
    updateFrame,
    updateOptions
  }
}

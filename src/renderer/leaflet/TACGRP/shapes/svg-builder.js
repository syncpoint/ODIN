import L from 'leaflet'
import { K } from '../../../../shared/combinators'
import { clippingStrategy } from './clipping'
import { noop, elementCache } from './cache'

const DEFAULT_FONT_SIZE = 14


const textAnchor = alignment => {
  switch (alignment) {
    case 'left': return 'start'
    case 'right': return 'end'
    case 'center': return 'middle'
    default: return 'middle'
  }
}

const text = descriptor => L.SVG.text({
  'font-size': descriptor['font-size'],
  'text-anchor': textAnchor(descriptor.alignment),
  'alignment-baseline': 'central'
})

const tspan = descriptor => L.SVG.tspan({
  dy: '1.2em',
  'text-anchor': textAnchor(descriptor.alignment),
  'alignment-baseline': 'central'
})


/**
 *
 */
export const svgBuilder = (group, options, callbacks) => {
  const state = { attached: false, options }
  const cache = elementCache()
  const removeChild = parent => element => cache.element(parent).removeChild(element)
  const style = name => state.options.stylesX[name]
  const labels = () => state.options.labels

  cache.put('group', group)(noop)
  cache.put('defs', L.SVG.create('defs'))(noop)
  cache.element('group').appendChild(cache.element('defs'))

  const clipping = clippingStrategy(options.styles.clipping)(cache)
  const paths = (callbacks.paths && callbacks.paths()) || [ 'outline', 'path' ]

  const interactive = options.interactive
    ? element => K(element)(element => L.DomUtil.addClass(element, 'leaflet-interactive'))
    : element => element

  const renderLabels = () => {
    clipping.reset()
    cache.put('labels', L.SVG.create('g'))(removeChild('group'))
    cache.element('group').appendChild(cache.element('labels'))

    const placements = callbacks.placements && callbacks.placements(state.frame)
    ;(labels() || []).forEach(descriptor => {

      // placement: either literal or function:
      const center = typeof descriptor.placement === 'function'
        ? descriptor.placement(state.frame)
        : placements[descriptor.placement]

      // angle: either literal or function:
      const angle = typeof descriptor.angle === 'function'
        ? descriptor.angle(state.frame)
        : descriptor.angle || 0

      const fontSize = descriptor['font-size'] || DEFAULT_FONT_SIZE
      const label = text(descriptor)
      label.setAttribute('y', center.y)

      const textElement = index => index
        ? label.appendChild(tspan(descriptor))
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
      const tx = descriptor.alignment === 'left'
        ? -box.width / 2
        : descriptor.alignment === 'right'
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
    const d = L.SVG.pointsToPath(callbacks.points(frame), closed)
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

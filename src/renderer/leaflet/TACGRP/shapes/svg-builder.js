import L from 'leaflet'
import uuid from 'uuid-random'
import { K } from '../../../../shared/combinators'

const DEFAULT_FONT_SIZE = 14

export const noop = () => {}

export const elementCache = () => {
  const cache = {}

  const put = (id, element) => dispose => {
    cache[id] && cache[id].dispose(cache[id].element)
    cache[id] = { element, dispose }
    return element
  }

  const lazy = (id, fn) => {
    cache[id] && cache[id].dispose(cache[id].element)
    cache[id] = { fn, dispose: noop }
  }

  const element = id => {
    if (!cache[id]) throw Error(`element not cached: ${id}`)
    if (cache[id].fn) cache[id] = { element: cache[id].fn(), dispose: noop }
    return cache[id].element
  }

  const dispose = () => Object.values(cache).forEach(({ element, dispose }) => dispose(element))

  return { put, lazy, element, dispose }
}

const backdropClipping = cache => {
  const withLabel = element => {
    const box = L.SVG.inflate(element.getBBox(), 4)
    const backdrop = L.SVG.rect({
      x: box.x,
      y: box.y,
      // Apply same label transformation:
      transform: element.getAttribute('transform'),
      width: box.width,
      height: box.height,
      stroke: 'black',
      'stroke-width': 1,
      fill: 'white'
    })

    cache.element('labels').insertBefore(backdrop, element)
  }

  return {
    reset: () => {},
    withLabel,
    withPath: element => element,
    finish: () => {}
  }
}

const maskClipping = cache => {
  const id = uuid()
  const clip = L.SVG.mask({ id: `mask-${id}` })
  const whiteMask = L.SVG.rect({ fill: 'white' })
  const blackMasks = []

  const reset = () => {
    cache.element('defs').appendChild(clip)
    clip.appendChild(whiteMask)

    // Clear-out masks and labels:
    blackMasks.forEach(mask => clip.removeChild(mask))
    blackMasks.length = 0
  }

  const withLabel = element => {
    // Determin label region which should be clipped from path (black mask):
    const maskBox = L.SVG.inflate(element.getBBox(), 8)
    const blackMask = L.SVG.rect({
      x: maskBox.x,
      y: maskBox.y,
      // Apply same label transformation:
      transform: element.getAttribute('transform'),
      width: maskBox.width,
      height: maskBox.height
    })

    blackMasks.push(blackMask)
    clip.appendChild(blackMask)
  }

  const withPath = element => {
    element.setAttribute('mask', `url(#mask-${id})`)
    return element
  }

  const finish = () => {
    // Update white mask (necessary for proper clipping):
    const box = cache.element('group').getBBox()
    L.SVG.setAttributes(whiteMask)({ ...L.SVG.inflate(box, 20) })
  }

  return {
    reset,
    withLabel,
    withPath,
    finish
  }
}

const noClipping = cache => {
  return {
    reset: () => {},
    withLabel: () => {},
    withPath: element => element,
    finish: () => {}
  }
}

const clippingStrategy = clipping => cache => {
  switch (clipping) {
    case 'mask': return maskClipping(cache)
    case 'backdrop': return backdropClipping(cache)
    default: return noClipping(cache)
  }
}

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
  const removeChild = parent => element => cache.element(parent).removeChild(element)

  // TODO: add 'defs' to 'group'
  cache.lazy('defs', () => {
    const element = L.SVG.create('defs')
    cache.element('group').appendChild(element)
    return element
  })

  const clipping = clippingStrategy(options.styles.clipping)(cache)
  const paths = []

  const interactive = options.interactive
    ? element => K(element)(element => L.DomUtil.addClass(element, 'leaflet-interactive'))
    : element => element

  const renderLabels = () => {
    cache.put('labels', L.SVG.create('g'))(removeChild('group'))
    cache.element('group').appendChild(cache.element('labels'))

    clipping.reset()

    const placements = callbacks.placements(state.frame)
    callbacks.labels(state.frame).forEach(descriptor => {
      const fontSize = descriptor['font-size'] || DEFAULT_FONT_SIZE
      const label = text(descriptor)
      label.setAttribute('y', placements[descriptor.placement].y)

      const textElement = index => index
        ? label.appendChild(tspan(descriptor))
        : label

      descriptor.lines.filter(line => line).forEach((line, index) => {
        const element = textElement(index)
        const match = line.match(/<bold>(.*)<\/bold>/)
        const bold = (match && !!match[1]) || false
        element.textContent = bold ? match[1] : line
        element.setAttribute('x', placements[descriptor.placement].x)
        element.setAttribute('font-weight', bold ? 'bold' : 'normal')
      })

      cache.element('labels').appendChild(label)

      const box = label.getBBox()
      const ty = fontSize / 2 - box.height / 2
      const tx = descriptor.alignment === 'left'
        ? -box.width / 2
        : descriptor.alignment === 'right'
          ? box.width / 2
          : 0

      const angle = descriptor.angle || 0
      const center = placements[descriptor.placement]
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

  const path = name => paths.push(name)

  const attach = group => {
    cache.put('group', group)(noop)

    paths
      .map(name => cache.put(name, L.SVG.path(callbacks.style(name)))(noop))
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

    const { points, closed } = callbacks.points(frame)
    const d = L.SVG.pointsToPath(points, closed)
    paths.forEach(name => cache.element(name).setAttribute('d', d))
    renderLabels()
  }

  const refresh = () => {
    paths.forEach(name => {
      L.SVG.setAttributes(cache.element(name))(callbacks.style(name))
    })

    renderLabels()
  }

  return {
    path,
    attach,
    updateFrame,
    refresh
  }
}

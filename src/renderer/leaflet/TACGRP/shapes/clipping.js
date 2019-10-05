import L from 'leaflet'
import uuid from 'uuid-random'

/**
 *
 */
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


/**
 *
 */
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


/**
 *
 */
const noClipping = cache => {
  return {
    reset: () => {},
    withLabel: () => {},
    withPath: element => element,
    finish: () => {}
  }
}


/**
 *
 */
export const clippingStrategy = clipping => cache => {
  switch (clipping) {
    case 'mask': return maskClipping(cache)
    case 'backdrop': return backdropClipping(cache)
    default: return noClipping(cache)
  }
}

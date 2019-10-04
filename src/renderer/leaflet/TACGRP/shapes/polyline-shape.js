import L from 'leaflet'
import uuid from 'uuid-random'
import { elementCache, noop, clippingStrategy } from './common'

/**
 *
 */
const renderPath = (cache, points, lineSmoothing) => {
  const d = L.SVG.pointsToPath([points], false, !!lineSmoothing)
  cache.element('outline').setAttribute('d', d)
  cache.element('path').setAttribute('d', d)
}

export const polylineShape = (group, options) => {

  const isAttached = () => group.parentNode

  // Mutable state:
  const current = { options }
  const points = () => current.points
  const styles = () => current.options.styles
  const lineSmoothing = () => current.options.lineSmoothing
  const interactive = () => current.options.interactive

  const cache = elementCache()

  cache.put('group', group)(noop)
  cache.put('defs', L.SVG.create('defs'))(noop)
  cache.put('labels', L.SVG.create('g'))(element => cache.element('group').removeChild(element))

  cache.element('group').appendChild(cache.element('defs'))
  cache.element('group').appendChild(cache.element('labels'))

  // Transparent path to increase clickable area:
  cache.put('outline', L.SVG.path({
    'stroke-width': 7,
    stroke: 'black',
    'stroke-linejoin': 'round',
    fill: 'none'
  }))(noop)

  cache.put('path', L.SVG.path({}))(noop)

  if (interactive()) {
    L.DomUtil.addClass(cache.element('outline'), 'leaflet-interactive')
    L.DomUtil.addClass(cache.element('path'), 'leaflet-interactive')
  }

  cache.element('group').appendChild(cache.element('outline'))
  cache.element('group').appendChild(cache.element('path'))

  const clipping = clippingStrategy(styles().clipping)(cache)

  const updateOptions = options => {
    clipping.reset()
    current.options = options

    L.SVG.setAttributes(cache.element('path'))({
      'stroke-width': styles().strokeWidth,
      'stroke-dasharray': styles().strokeDashArray,
      'stroke-linejoin': 'round',
      stroke: styles().stroke,
      'fill-opacity': styles().fillOpacity
    })

    clipping.withPath(cache.element('outline'))
    clipping.withPath(cache.element('path'))

    if (styles().fill === 'diagonal') {
      const patternId = `pattern-${uuid()}`
      cache.put('pattern', L.SVG.diagonalPattern(patternId, styles()))(element => {
        cache.element('defs').removeChild(element)
      })

      cache.element('defs').appendChild(cache.element('pattern'))
      cache.element('path').setAttribute('fill', `url(#${patternId})`)
    } else {
      cache.element('path').setAttribute('fill', styles().fill)
    }
  }


  const updateFrame = frame => {
    current.points = frame.points
    if (!isAttached()) return

    clipping.reset()
    renderPath(cache, points(), lineSmoothing())
    clipping.finish()
  }

  const attached = () => {
    // Now, group is registered with DOM.
    updateOptions(options)
    updateFrame({ points: points() })
  }

  return {
    updateFrame,
    updateOptions,
    attached
  }
}

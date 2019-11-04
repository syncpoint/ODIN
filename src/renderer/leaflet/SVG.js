import L from 'leaflet'
import { K } from '../../shared/combinators'
import { svgPath, bezierCommand } from './smooth'

const setAttribute = (o, [k, v]) => K(o)(o => o.setAttribute(k, v))
L.SVG.setAttributes = o => attrs => Object.entries(attrs).reduce(setAttribute, o)

// inflate :: SVGRect => number => SVGRect-like
L.SVG.inflate = (rect, delta) => ({
  x: rect.x - delta,
  y: rect.y - delta,
  width: rect.width + 2 * delta,
  height: rect.height + 2 * delta
})

const pointsToPath = L.SVG.pointsToPath
L.SVG.pointsToPath = (rings, closed, smooth) => {
  if (!smooth) return pointsToPath(rings, closed)
  else {
    const points = rings[0].map(({ x, y }) => [x, y])
    return svgPath(points, bezierCommand)
  }
}

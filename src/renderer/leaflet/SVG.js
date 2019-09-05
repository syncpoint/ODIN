import L from 'leaflet'
import { K } from '../../shared/combinators'
import { svgPath, bezierCommand } from './smooth'

const setAttribute = (o, [k, v]) => K(o)(o => o.setAttribute(k, v))
L.SVG.setAttributes = o => attrs => Object.entries(attrs).reduce(setAttribute, o)

L.SVG.mask = attrs => L.SVG.setAttributes(L.SVG.create('mask'))(attrs)
L.SVG.rect = attrs => L.SVG.setAttributes(L.SVG.create('rect'))(attrs)
L.SVG.path = attrs => L.SVG.setAttributes(L.SVG.create('path'))(attrs)
L.SVG.text = attrs => L.SVG.setAttributes(L.SVG.create('text'))(attrs)
L.SVG.tspan = attrs => L.SVG.setAttributes(L.SVG.create('tspan'))(attrs)
L.SVG.g = attrs => L.SVG.setAttributes(L.SVG.create('g'))(attrs)

// inflate :: SVGRect => number => SVGRect-like
L.SVG.inflate = (rect, delta) => ({
  x: rect.x - delta,
  y: rect.y - delta,
  width: rect.width + 2 * delta,
  height: rect.height + 2 * delta
})

L.SVG.transformLabel = (center, angle) => {
  const flip = (angle > 180) ? -1 : 1
  return `
    translate(${center.x} ${center.y})
    rotate(${angle - 90})
    scale(${flip} ${flip})`
}

L.SVG.transformBackdrop = (center, bbox, angle) => `
  translate(${center.x} ${center.y})
  rotate(${angle - 90})
  scale(1.4 1.2)
  translate(${bbox.x} ${bbox.y})`

const pointsToPath = L.SVG.pointsToPath
L.SVG.pointsToPath = (rings, closed, smooth) => {
  if (!smooth) return pointsToPath(rings, closed)
  else {
    const points = rings[0].map(({ x, y }) => [x, y])
    return svgPath(points, bezierCommand)
  }
}

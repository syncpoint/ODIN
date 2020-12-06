const svg = (width, body) => `<svg width="${width}" height="50" version="1.1" xmlns="http://www.w3.org/2000/svg">${body}</svg>`

const attrs = xs => Object.entries(xs)
  .filter(([key]) => key !== 'type')
  .map(([key, value]) => `${key}="${value}"`)
  .join(' ')

const element = xs => `<${xs.type} ${attrs(xs)}/>`
const strokeWhite = { 'stroke-width': 12, stroke: 'white', 'stroke-linecap': 'round', fill: 'none' }
const strokeBlack = { 'stroke-width': 4, stroke: 'black', fill: 'none' }
const path = d => [strokeWhite, strokeBlack]
  .map(stroke => ({ type: 'path', ...stroke, d }))
  .map(element).join('')

const team = () => {
  const props = [
    { type: 'circle', cx: 20, cy: 25, r: 15 },
    { type: 'path', d: 'M0,35 l40,-20' }]

  return [strokeWhite, strokeBlack]
    .flatMap(stroke => props.map(p => ({ ...p, ...stroke })))
    .map(element)
    .join('')
}

const dot = xs => xs.map(x => element({
  type: 'circle',
  cx: x,
  cy: 25,
  r: 11,
  'stroke-width': 4,
  stroke: 'white',
  fill: 'black'
})).join('')


const pipe = xs => path(xs.map(x => `M${x},12.5 l0,25`).join(' '))
const cross = xs => path(xs.map(x => `M${x},12.5 l25,25 m0,-25 l-25,25`).join(' '))
const plus = xs => path(xs.map(x => `M${x},25 l25,0 m-12.5,12.5 l0,-25`).join(' '))

export default {
  A: svg(40, team()),
  B: svg(32, dot([16])),
  C: svg(52, dot([11, 41])),
  D: svg(82, dot([11, 41, 71])),
  E: svg(30, pipe([15])),
  F: svg(40, pipe([10, 30])),
  G: svg(60, pipe([10, 30, 50])),
  H: svg(35, cross([5])),
  I: svg(70, cross([5, 40])),
  J: svg(105, cross([5, 40, 75])),
  K: svg(140, cross([5, 40, 75, 110])),
  L: svg(175, cross([5, 40, 75, 110, 145])),
  M: svg(210, cross([5, 40, 75, 110, 145, 180])),
  N: svg(70, plus([5, 40]))
}

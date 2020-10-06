const svg = body => `<svg width="210" height="50" version="1.1" xmlns="http://www.w3.org/2000/svg">${body}</svg>`

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
    { type: 'circle', cx: 105, cy: 25, r: 15 },
    { type: 'path', d: 'M85,35 l40,-20' }]

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
  A: svg(team()),
  B: svg(dot([105])),
  C: svg(dot([90, 120])),
  D: svg(dot([75, 105, 135])),
  E: svg(pipe([105])),
  F: svg(pipe([95, 115])),
  G: svg(pipe([85, 105, 125])),
  H: svg(cross([92.5])),
  I: svg(cross([75, 110])),
  J: svg(cross([57.5, 92.5, 127.5])),
  K: svg(cross([40, 75, 110, 145])),
  L: svg(cross([22.5, 57.5, 92.5, 127.5, 162.5])),
  M: svg(cross([5, 40, 75, 110, 145, 180])),
  N: svg(plus([75, 110]))
}

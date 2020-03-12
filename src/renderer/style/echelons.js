/*
  Echelon SVG construction.

  Adopted from Måns Beckman's awesome milsymbol library:
  https://github.com/spatialillusions/milsymbol

  Copyright (c) Måns Beckman - www.spatialillusions.com
*/

const circle = (r = 7.5, fill = 'black') => cx => `<circle fill="${fill}" cx="${cx}" cy="20" r="${r}"/>`
const path = d => `<path d="${d}"/>`
const pipe = x => path(`M${x},30 L${x},5`)
const cross = x => `M${x},30 l25,-25 m0,25 l-25,-25`
const plus = x => `M${x},17.5 l25,0 m-12.5,12.5 l0,-25`

const template = paths =>
`<svg
  version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="200"
  height="35"
>
  <g stroke-width="7" stroke="white" fill="none">${paths}</g>
  <g stroke-width="4" stroke="black" fill="none">${paths}</g>
</svg>`

const paths = {
  A: [circle(15, 'none')(100), path('M80,30 L120,10')].join(' '),
  B: [circle()(100)].join(' '),
  C: [115, 85].map(circle()).join(' '),
  D: [100, 70, 130].map(circle()).join(' '),
  E: [pipe(100)].join(),
  F: [90, 110].map(pipe).join(' '),
  G: [100, 120, 80].map(pipe).join(' '),
  H: [path(cross(87.5))],
  I: [path([70, 105].map(cross).join())].join(' '),
  J: [path([52.5, 87.5, 122.5].map(cross).join())].join(' '),
  K: [path([35, 70, 105, 140].map(cross).join())].join(' '),
  L: [path([17.5, 52.5, 87.5, 122.5, 157.5].map(cross).join())].join(' '),
  M: [path([0, 35, 70, 105, 140, 175].map(cross).join())].join(' '),
  N: [path([70, 105].map(plus).join())].join(' ')
}

// Echelon indicator -> SVG group.
// Reference: MIL-STD-2525C, TABLE V
export default echelon => `data:image/svg+xml;utf8,${template(paths[echelon])}`

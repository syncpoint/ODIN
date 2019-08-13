/*
  Echelon SVG construction.

  Adopted from Måns Beckman's awesome milsymbol library:
  https://github.com/spatialillusions/milsymbol

  Copyright (c) Måns Beckman - www.spatialillusions.com
*/

const circle = (r = 7.5, fill = 'black') => cx =>
  ({ type: 'circle', fill, cx, cy: 180, r })
const path = d => ({ type: 'path', d })
const pipe = x => path(`M${x},190 L${x},165`)
const cross = x => `M${x},190 l25,-25 m0,25 l-25,-25`
const plus = x => `M${x},177.5 l25,0 m-12.5,12.5 l0,-25`


// Echelon indicator -> SVG group.
// Reference: MIL-STD-2525C, TABLE V
// TODO: needs additional indirection when we support 'long' SIDCs.
export default {
  A: [circle(15, 'none')(100), path('M80,190 L120,170')],
  B: [circle()(100)],
  C: [115, 85].map(circle()),
  D: [100, 70, 130].map(circle()),
  E: [pipe(100)],
  F: [90, 110].map(pipe),
  G: [100, 120, 80].map(pipe),
  H: [path(cross(87.5))],
  I: [path([70, 105].map(cross).join())],
  J: [path([52.5, 87.5, 122.5].map(cross).join())],
  K: [path([35, 70, 105, 140].map(cross).join())],
  L: [path([17.5, 52.5, 87.5, 122.5, 157.5].map(cross).join())],
  M: [path([0, 35, 70, 105, 140, 175].map(cross).join())],
  N: [path([70, 105].map(plus).join())]
}

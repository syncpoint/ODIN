import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as style from 'ol/style'
import * as G from './geodesy'

export const defaultFont = '14px sans-serif'
export const biggerFont = '16px sans-serif'


export const whiteStroke = new style.Stroke({ color: 'white', width: 3 })

export const arc = (C, radius, angle, circumference, quads = 48) =>
  R.range(0, quads + 1)
    .map(i => angle + i * (circumference / quads))
    .map(offset => C.destinationPoint(radius, offset))


const flip = angle => (angle > 0 && angle <= 180) ? -1 : 1

export const arcLabel = (C, radius, angle, text) => new style.Style({
  geometry: new geom.Point(G.fromLatLon(C.destinationPoint(radius, angle + 180))),
  text: new style.Text({
    text,
    rotation: (angle + flip(angle) * 90) / 180 * Math.PI,
    font: biggerFont,
    stroke: whiteStroke
  })
})

// <<= DEPRECATED

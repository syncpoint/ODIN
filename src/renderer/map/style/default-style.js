import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as style from 'ol/style'
import ColorSchemes from './color-schemes'
import { K } from '../../../shared/combinators'
import * as G from './geodesy'

export const defaultFont = '14px sans-serif'
export const biggerFont = '16px sans-serif'

const identity = sidc => sidc ? sidc[1] : 'U' // identity or U - UNKNOWN
const status = sidc => sidc ? sidc[3] : 'P' // status or P - PRESENT
const strokeOutlineColor = sidc => identity(sidc) === '*' ? '#FFFFFF' : '#000000'
const lineDash = sidc => status(sidc) === 'A' ? [20, 10] : null

const strokeColor = (sidc, n) => {
  const colorScheme = ColorSchemes.medium
  if (n === 'ENY') return colorScheme.red

  // 2525C, table TABLE XIII:
  switch (identity(sidc)) {
    case 'A': // Assumed Friend
    case 'F': // Friend
    case 'M': // Exercise Assumed Friend
    case 'D': // Exercise Friend
      return colorScheme.blue
    case 'H': // Hostile
    case 'J': // Joker
    case 'K': // Faker
    case 'S': // Suspect
      return colorScheme.red
    case 'N': // Neutral
    case 'L': // Exercise Neutral
      return colorScheme.green
    case 'U': // Unknown
    case 'P': // Pending
    case 'G': // Exercise Pending
    case 'W': // Exercise Unknown
      return colorScheme.yellow
    default: return 'black'
  }
}

const outlineStroke = sidc => new style.Stroke({
  color: strokeOutlineColor(sidc),
  lineDash: lineDash(sidc),
  width: 3.5
})

const stroke = (sidc, n) => new style.Stroke({
  color: strokeColor(sidc, n),
  lineDash: lineDash(sidc),
  width: 2
})

const white = [255, 255, 255, 1]
const blue = [0, 153, 255, 1]
const width = 3

export const whiteStroke = new style.Stroke({ color: 'white', width: 3 })

export const defaultStyle = (feature, resolution) => {
  const { sidc, n } = feature.getProperties()
  const styles = []
  styles.push(new style.Style({
    stroke: outlineStroke(sidc),

    // Fallback to make POINT/MULTI_POINT visible.
    image: new style.Circle({
      radius: width * 2,
      fill: new style.Fill({ color: blue }),
      stroke: new style.Stroke({ color: white, width: width / 2 })
    })
  }))
  styles.push(new style.Style({
    stroke: stroke(sidc, n)
  }))
  return styles
}

const multiLineString = lines =>
  new geom.MultiLineString(lines.map(line => line.map(G.fromLatLon)))

export const lineStyle = (feature, lines) => {
  const styles = defaultStyle(feature)

  // It is quite possible that feature's extent is too small
  // to construct a valid geometry. Use default style in this case.

  try {
    const geometry = multiLineString(lines)
    return K(styles)(xs => xs.forEach(s => s.setGeometry(geometry)))
  } catch (err) {
    return styles
  }
}

export const arc = (C, radius, angle, circumference, quads = 48) =>
  R.range(0, quads + 1)
    .map(i => angle + i * (circumference / quads))
    .map(offset => C.destinationPoint(radius, offset))


const flip = angle => (angle > 0 && angle <= 180) ? -1 : 1

export const lineLabel = ([A, B], text, frac = 0.5) => {
  const [bearing, distance] = G.bearingLine([A, B])

  return new style.Style({
    geometry: new geom.Point(G.fromLatLon(A.destinationPoint(distance * frac, bearing))),
    text: new style.Text({
      text,
      rotation: (bearing + flip(bearing) * 90) / 180 * Math.PI,
      font: biggerFont,
      stroke: whiteStroke
    })
  })
}

export const arcLabel = (C, radius, angle, text) => new style.Style({
  geometry: new geom.Point(G.fromLatLon(C.destinationPoint(radius, angle + 180))),
  text: new style.Text({
    text,
    rotation: (angle + flip(angle) * 90) / 180 * Math.PI,
    font: biggerFont,
    stroke: whiteStroke
  })
})

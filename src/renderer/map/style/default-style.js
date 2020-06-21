import * as style from 'ol/style'
import ColorSchemes from './color-schemes'

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

export default (feature, resolution) => {
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

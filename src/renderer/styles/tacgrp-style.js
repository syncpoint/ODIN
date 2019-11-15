import * as R from 'ramda'
import ColorSchemes from './color-schemes'
import { Style, Stroke } from './predef'
import tacgrp from './tacgrp'
import './G-G-GAA---'
import './G-G-GLL---'
import './G-M-OFA---'
import './G-S-AE----'


/**
 * normalizeSIDC :: String -> String
 */
const normalizeSIDC = sidc => `${sidc[0]}-${sidc[2]}-${sidc.substring(4, 10)}`

const strokeColor = (sidc, n) => {
  const colorScheme = ColorSchemes['medium']
  if (n === 'ENY') return colorScheme.red
  const identity = sidc ? sidc[1] : 'U' // identity or U - UNKNOWN
  switch (identity) {
    case 'F': return colorScheme.blue
    case 'H': return colorScheme.red
    case 'N': return colorScheme.green
    case 'U': return colorScheme.yellow
    default: return 'black'
  }
}

const strokeOutlineColor = sidc => {
  const identity = sidc ? sidc[1] : 'U' // identity or U - UNKNOWN
  return identity === '*' ? '#FFFFFF' : '#000000'
}

const lineDash = sidc => {
  const status = sidc ? sidc[3] : 'P' // status or P - PRESENT
  if (status === 'A') return [20, 10]
}

const defaultStyle = color => feature => {
  const { sidc, n } = feature.getProperties()
  const strokeProps = (color, width) => ({ color, width, lineDash: lineDash(sidc) })
  const outline = Stroke.of(strokeProps(color(strokeOutlineColor(sidc)), 3))
  const stroke = Stroke.of(strokeProps(color(strokeColor(sidc, n)), 2))

  // Label function or noop:
  const labelStyle = R.cond([
    [R.complement(R.isNil), o => o.labels],
    [R.T, () => () => []]
  ])(tacgrp[normalizeSIDC(sidc)])

  return [
    () => Style.of({ stroke: outline }),
    () => Style.of({ stroke: stroke }),
    labelStyle
  ].flatMap(fn => fn(feature))
}

export default modeOptions => (feature, resolution) => {
  const parseColor = hex => parseInt(hex.substring(1), 16)
  const invertColor = color => 0xFFFFFF ^ color
  const formatColor = color => '#' + ('000000' + color.toString(16)).slice(-6)

  const color = modeOptions.mode === 'highlighted'
    ? R.compose(formatColor, invertColor, parseColor)
    : x => x
  return defaultStyle(color)(feature)
}

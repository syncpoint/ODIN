/* eslint-disable */
import * as style from 'ol/style'
import ColorSchemes from './color-schemes'
import tacgrp from './tacgrp'
import './G-G-GLL---'
import './G-M-OFA---'

const Style = { of: props => new style.Style(props) }
const Stroke = { of: props => new style.Stroke(props) }

/**
 * normalizeSIDC :: string -> string
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
  return identity === '*' ? 'white' : 'black'
}

const lineDash = sidc => {
  const status = sidc ? sidc[3] : 'P' // status or P - PRESENT
  if (status === 'A') return [20, 10]
}

const defaultStyle = color => feature => {
  const { sidc, n } = feature.getProperties()
  const strokeOutline = color(strokeOutlineColor(sidc))
  const stroke = color(strokeColor(sidc, n))

  const defaultStyle = feature => {
    return [
      Style.of({ stroke: Stroke.of({ color: strokeOutline, width: 3, lineDash: lineDash(sidc) }) }),
      Style.of({ stroke: Stroke.of({ color: stroke, width: 2, lineDash: lineDash(sidc) }) })
    ]
  }

  const labelStyle =
    (tacgrp[normalizeSIDC(sidc)] && tacgrp[normalizeSIDC(sidc)].labels) || (() => [])

  return [defaultStyle, labelStyle].flatMap(fn => fn(feature))
}

const invertColor = hexColor => {
  const color = parseInt(hexColor.substring(1), 16)
  const invertedValue = 0xFFFFFF ^ color
  return '#' + ("000000" + invertedValue.toString(16)).slice(-6)
}

export default modeOptions => (feature, resolution) => {
  const color = modeOptions.mode === 'highlighted' ? invertColor : x => x
  return defaultStyle(color)(feature)
}

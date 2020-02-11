/* eslint-disable */
import moment from 'moment'
import * as R from 'ramda'
import { Stroke, Style, Icon } from 'ol/style'
import ms from 'milsymbol'
import { K } from '../shared/combinators'
import ColorSchemes from './color-schemes'
import Polygon from './style-polygon'
import preferences from './preferences'

/*
  INGREDIENTS:
  - STYLE PREFERENCE OBSERVERS
  - (MIL) SYMBOL STYLING
  - TACTICAL GRAPHICS STYLING
  - FEATURE STYLE FUNCTION
*/

/**
 * normalizeSIDC :: String -> String
 */
export const normalizeSIDC = sidc => `${sidc[0]}-${sidc[2]}-${sidc.substring(4, 10)}`

/**
 * STYLE PREFERENCES OBSERVERS.
 */

const featuresPrefs = preferences.features()

let showLabels = true
let symbolScale = featuresPrefs.defaultSymbolScale

;(async () => {
  showLabels = await featuresPrefs.get('labels')
  symbolScale = await featuresPrefs.symbolScale()
  featuresPrefs.observe(value => (showLabels = value))('labels')
  featuresPrefs.observe(value => (symbolScale = value))('symbol-scale')
})()


/**
 * (MIL) SYMBOL STYLING.
 */

const MODIFIERS = {
  c: 'quantity',
  f: 'reinforcedReduced',
  g: 'staffComments',
  h: 'additionalInformation',
  m: 'higherFormation',
  q: 'direction',
  t: 'uniqueDesignation',
  v: 'type',
  z: 'speed',
  aa: 'specialHeadquarters'
}

const fromNow = dtg => dtg && moment(dtg, 'DDHHmmZ MMM YYYY').fromNow()
const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .map(([key, value]) => ([key, key === 'w' ? fromNow(value) : value]))
  .filter(([key, value]) => {
    if (key === 't' && value === '[NO FORMALABBREVIATEDNAME]') return false
    if (key === 't' && value === 'Untitled') return false
    if (key === 'v' && value === 'Not otherwise specified') return false
    if (key === 'v' && value === 'Not Specified') return false
    return true
  })
  .reduce((acc, [key, value]) => K(acc)(acc => (acc[MODIFIERS[key]] = value)), {})


const icon = symbol => {
  const anchor = [symbol.getAnchor().x, symbol.getAnchor().y]
  const imgSize = size => [Math.floor(size.width), Math.floor(size.height)]
  return new Icon({
    anchor,
    scale: symbolScale,
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    imgSize: imgSize(symbol.getSize()),
    img: symbol.asCanvas()
  })
}

const identity = sidc => sidc ? sidc[1] : 'U' // identity or U - UNKNOWN
const status = sidc => sidc ? sidc[3] : 'P' // status or P - PRESENT
const strokeOutlineColor = sidc => identity(sidc) === '*' ? '#FFFFFF' : '#000000'
const lineDash = sidc => status(sidc) === 'A' ? [20, 10] : null

const symbolStyleModes = {
  default: {
    outlineWidth: 4,
    outlineColor: 'white'
  },
  selected: {
    outlineWidth: 6,
    outlineColor: 'black',
    monoColor: 'white'
  }
}

// Point geometry, aka symbol.
const symbolStyle = (feature, resolution) => {
  const { sidc, ...properties } = feature.getProperties()
  const mode = feature.get('selected') ? 'selected' : 'default'
  const symbolProperties = showLabels
    ? { ...modifiers(properties), ...symbolStyleModes[mode] }
    : { ...symbolStyleModes[mode] }

  const symbol = new ms.Symbol(sidc, symbolProperties)
  return symbol.isValid()
    ? new Style({ image: icon(symbol) })
    : fallbackStyle(feature, resolution)
}


/**
 * TACTICAL GRAPHICS STYLING.
 */

const strokeColor = (sidc, n) => {
  const colorScheme = ColorSchemes.medium
  if (n === 'ENY') return colorScheme.red
  switch (identity(sidc)) {
    case 'F': return colorScheme.blue
    case 'H': return colorScheme.red
    case 'N': return colorScheme.green
    case 'U': return colorScheme.yellow
    default: return 'black'
  }
}

const outlineStroke = sidc => new Stroke({
  color: strokeOutlineColor(sidc),
  lineDash: lineDash(sidc),
  width: 3.5
})

const stroke = (sidc, n) => new Stroke({
  color: strokeColor(sidc, n),
  lineDash: lineDash(sidc),
  width: 2
})

const fallbackStyle = (feature, resolution) => {
  const { sidc, n } = feature.getProperties()
  const styles = []
  styles.push(new Style({ stroke: outlineStroke(sidc) }))
  styles.push(new Style({ stroke: stroke(sidc, n) }))
  return styles
}

const polygonStyle = (feature, resolution) => {
  const sidc = normalizeSIDC(feature.getProperties().sidc)
  const styleFns = Polygon.style[sidc] || Polygon.defaultStyle
  const fallback = fallbackStyle(feature, resolution)
  return fallback.concat(styleFns.flatMap(fn => fn(feature)))
}

/**
 * FEATURE STYLE FUNCTION.
 */

export const style = (feature, resolution) => {
  const geometryType = feature.getGeometry().getType()
  const provider = R.cond([
    [R.equals('Point'), R.always(symbolStyle)],
    [R.equals('Polygon'), R.always(polygonStyle)],
    [R.T, R.always(fallbackStyle)]
  ])

  // NOTE: Style is cached when not selected; clear cache when necessary.
  const style = provider(geometryType)(feature, resolution)
  if (!feature.get('selected')) feature.setStyle(style)
  return style
}

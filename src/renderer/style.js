import moment from 'moment'
import { Stroke, Style, Icon, Fill } from 'ol/style'
import ms from 'milsymbol'
import { K } from '../shared/combinators'
import ColorSchemes from './color-schemes'
import preferences from './preferences'

const featuresPrefs = preferences.features()

let showLabels = true
let symbolScale = featuresPrefs.defaultSymbolScale

;(async () => {
  showLabels = await featuresPrefs.get('labels')
  symbolScale = await featuresPrefs.symbolScale()
  featuresPrefs.observe(value => (showLabels = value))('labels')
  featuresPrefs.observe(value => (symbolScale = value))('symbol-scale')
})()

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

const fromNow = dtg => dtg && moment(dtg, 'DDHHmmZ MMM YYYY').fromNow()

// TODO: increase icon image cache:
// TODO: https://openlayers.org/en/latest/apidoc/module-ol_style_IconImageCache-IconImageCache.html
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

const strokeColor = (sidc, n) => {
  const colorScheme = ColorSchemes.medium
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

const fallbackStyle = (feature, resolution) => {
  const { sidc, n } = feature.getProperties()

  const outline = new Stroke({
    color: strokeOutlineColor(sidc),
    lineDash: lineDash(sidc),
    width: 3
  })

  const stroke = new Stroke({
    color: strokeColor(sidc, n),
    lineDash: lineDash(sidc),

    width: 2
  })

  return [
    new Style({ stroke: outline }),
    new Style({
      stroke,
      fill: new Fill({
        color: 'rgba(255,255,255,0.3)'
      })
    })
  ]
}

const styles = {}

// Point geometry, aka symbol.
styles.Point = (feature, resolution) => {
  const { sidc, ...properties } = feature.getProperties()
  const symbolProperties = showLabels
    ? { ...modifiers(properties) }
    : {}

  const symbol = new ms.Symbol(sidc, symbolProperties)
  return symbol.isValid()
    ? new Style({ image: icon(symbol) })
    : fallbackStyle(feature, resolution)
}

export const style = function (feature, resolution) {
  const styleProvider = styles[feature.getGeometry().getType()] || fallbackStyle
  const style = styleProvider(feature, resolution)
  feature.setStyle(style)
  return style
}

import * as R from 'ramda'
import { Style, Icon } from 'ol/style'
import ms from 'milsymbol'
import { K } from '../../../shared/combinators'
import selection from '../../selection'
import { defaultStyle } from './default-style-2'
import { polygonStyle } from './polygon-style'
import { lineStyle } from './line-style'
import { multipointStyle } from './multipoint-style'
import { collectionStyle } from './collection-style'

/**
 * normalizeSIDC :: String -> String
 */
export const normalizeSIDC = sidc => sidc
  ? `${sidc[0]}-${sidc[2]}-${sidc.substring(4, 10)}`
  : 'MUZP------*****'

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
  aa: 'specialHeadquarters',
  w: 'dtg'
}

const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
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
    scale: 0.4,
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    imgSize: imgSize(symbol.getSize()),
    img: symbol.asCanvas()
  })
}

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
  const mode = selection.isSelected(feature.getId()) ? 'selected' : 'default'
  const symbolProperties = { ...modifiers(properties), ...symbolStyleModes[mode] }
  const symbol = new ms.Symbol(sidc, symbolProperties)
  return symbol.isValid()
    ? new Style({ image: icon(symbol) })
    : defaultStyle(feature)
}


/**
 * FEATURE STYLE FUNCTION.
 */

export default mode => (feature, resolution) => {
  const provider = R.cond([
    [R.equals('Point'), R.always(symbolStyle)],
    [R.equals('Polygon'), R.always(polygonStyle(mode))],
    [R.equals('LineString'), R.always(lineStyle(mode))],
    [R.equals('MultiPoint'), R.always(multipointStyle(mode))],
    [R.equals('GeometryCollection'), R.always(collectionStyle(mode))],
    [R.T, R.always(defaultStyle)]
  ])

  try {
    const type = feature.getGeometry().getType()
    return provider(type)(feature, resolution)
  } catch (err) {
    console.error('[style]', feature, err)
    return []
  }
}

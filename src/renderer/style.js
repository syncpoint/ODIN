import moment from 'moment'
import * as R from 'ramda'
import { Style, Icon } from 'ol/style'
import ms from 'milsymbol'
import { K } from '../shared/combinators'
import style from './style/style-default'
import Polygon from './style/style-polygon'
import Corridor from './style/style-corridor'

/*
  INGREDIENTS:
  - (MIL) SYMBOL STYLING
  - TACTICAL GRAPHICS STYLING
  - FEATURE STYLE FUNCTION
*/

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
  const mode = feature.get('selected') ? 'selected' : 'default'
  const symbolProperties = { ...modifiers(properties), ...symbolStyleModes[mode] }
  const symbol = new ms.Symbol(sidc, symbolProperties)
  return symbol.isValid()
    ? new Style({ image: icon(symbol) })
    : style(feature, resolution)
}


/**
 * TACTICAL GRAPHICS STYLING.
 */

const polygonStyle = (feature, resolution) => {
  const sidc = normalizeSIDC(feature.getProperties().sidc)
  const styleFns = Polygon.style[sidc] || Polygon.defaultStyle
  const styles = style(feature, resolution)
  return styles.concat(styleFns.flatMap(fn => fn(feature)))
}

const corridorStyle = (feature, resolution) => {
  const sidc = normalizeSIDC(feature.getProperties().sidc)
  const styleFns = Corridor.style[sidc] || Corridor.defaultStyle
  return styleFns.flatMap(fn => fn(feature))
}

/**
 * FEATURE STYLE FUNCTION.
 */

const geometryType = feature => {
  const type = feature.getGeometry().getType()

  /* eslint-disable camelcase */
  const { corridor_area_width_dim } = feature.getProperties()
  switch (type) {
    case 'LineString': return corridor_area_width_dim ? 'Corridor' : type
    default: return type
  }
}

export default (feature, resolution) => {

  const provider = R.cond([
    [R.equals('Point'), R.always(symbolStyle)],
    [R.equals('Polygon'), R.always(polygonStyle)],
    [R.equals('Corridor'), R.always(corridorStyle)],
    [R.T, R.always(style)]
  ])

  // NOTE: Style is cached when not selected; clear cache when necessary.
  const styles = provider(geometryType(feature))(feature, resolution)
  if (!feature.get('selected')) feature.setStyle(styles)
  return styles
}

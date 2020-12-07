import { Style, Icon } from 'ol/style'
import ms from 'milsymbol'
import { K } from '../../../shared/combinators'
import { defaultStyle } from './default-style'

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
  },
  multi: {
    outlineWidth: 6,
    outlineColor: 'black',
    monoColor: 'white'
  }
}

// Point geometry, aka symbol.
export const symbolStyle = context => (feature, resolution) => {
  const { mode } = context
  const { sidc, ...properties } = feature.getProperties()
  const infoFields = mode === 'selected' || resolution < 62 // roughly 1:150,000

  const symbol = new ms.Symbol(sidc, {
    ...modifiers(properties),
    ...symbolStyleModes[mode],
    infoFields
  })

  return symbol.isValid()
    ? new Style({ image: icon(symbol) })
    : defaultStyle(feature)
}

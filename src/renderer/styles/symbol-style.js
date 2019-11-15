import moment from 'moment'
import * as style from 'ol/style'
import { K } from '../../shared/combinators'

import ms from 'milsymbol'

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
  .reduce((acc, [key, value]) => K(acc)(acc => (acc[MODIFIERS[key]] = value)), {})

const fromNow = dtg => dtg && moment(dtg, 'DDHHmmZ MMM YYYY').fromNow()
const Symbol = { of: (sidc, props) => new ms.Symbol(sidc, props) }
const Style = { of: props => new style.Style(props) }

const Icon = {
  of: symbol => {
    const anchor = [symbol.getAnchor().x, symbol.getAnchor().y]
    const imgSize = size => [Math.floor(size.width), Math.floor(size.height)]
    return new style.Icon({
      anchor,
      scale: 0.4,
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      imgSize: imgSize(symbol.getSize()),
      img: symbol.asCanvas()
    })
  }
}

const MODES = {
  default: {
    outlineWidth: 3,
    outlineColor: 'white'
  },
  highlighted: {
    outlineWidth: 6,
    outlineColor: 'black',
    monoColor: 'white'
  }
}

export default modeOptions => (feature, resolution) => {
  const { sidc, ...properties } = feature.getProperties()
  const symbolProperties = { ...MODES[modeOptions.mode], ...modifiers(properties) }
  const symbol = Symbol.of(sidc, symbolProperties)
  const icon = Icon.of(symbol)
  return Style.of({ image: icon })
}

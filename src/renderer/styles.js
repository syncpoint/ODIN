import * as R from 'ramda'
import { Style, Stroke } from 'ol/style'
import Icon from 'ol/style/Icon'
import ms from 'milsymbol'


const ColorSchemes = {
  dark: {
    red: 'RGB(200, 0, 0)',
    blue: 'RGB(0, 107, 140)',
    green: 'RGB(0, 160, 0)',
    // recommended: 'RGB(225, 220, 0)'
    // more orange than yellow: 'RGB(225, 127, 0)'
    yellow: 'RGB(225, 127, 0)',
    purple: 'RGB(80, 0, 80)'
  },
  medium: {
    red: 'RGB(255, 48, 49)',
    blue: 'RGB(0, 168, 220)',
    green: 'RGB(0, 226, 0)',
    yellow: 'RGB(255, 255, 0)',
    purple: 'RGB(128, 0, 128)'
  }
}

/**
 * symbolStyle :: Feature -> Style
 *
 * NOTE: Style function is called frequently for all visible features.
 */
const symbolStyle = symbolOptions => {
  const anchor = symbol => [symbol.getAnchor().x, symbol.getAnchor().y]
  const imgSize = size => [Math.floor(size.width), Math.floor(size.height)]
  const options = icon => ({ image: icon })
  const style = options => new Style(options)
  const properties = feature => feature.getProperties()

  const icon = symbol => new Icon({
    scale: 0.4,
    anchor: anchor(symbol),
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    imgSize: imgSize(symbol.getSize()),
    img: symbol.asCanvas()
  })

  // TODO: cache style per feature (ol_uid/revision).
  // featureStyle :: Feature -> resolution -> Style
  const symbol = infoFields => ({ sidc, t }) => new ms.Symbol(sidc, {
    uniqueDesignation: t,
    infoFields,
    ...symbolOptions
  })

  return (feature, resolution) => {
    const infoFields = resolution < 100
    const fn = resolution > 2000
      ? () => null
      : R.compose(style, options, icon, symbol(infoFields), properties)
    return fn(feature)
  }
}

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

const gfxStyle = modeOptions => (feature, resolution) => {
  const { sidc, n } = feature.getProperties()
  return [
    new Style({ stroke: new Stroke({ color: strokeOutlineColor(sidc), width: 3 }) }),
    new Style({ stroke: new Stroke({ color: strokeColor(sidc, n), width: 2 }) })
  ]
}

const featureStyle = modeOptions => (feature, resolution) => {
  if (!feature.getGeometry()) return null

  const fn = feature.getGeometry().getType() === 'Point'
    ? symbolStyle
    : gfxStyle

  return fn(modeOptions)(feature, resolution)
}

export const defaultStyle = featureStyle({
  mode: 'default',
  outlineWidth: 3,
  outlineColor: 'white'
})

export const highlightStyle = featureStyle({
  mode: 'highlighted',
  outlineWidth: 6,
  outlineColor: 'black',
  monoColor: 'white'
})

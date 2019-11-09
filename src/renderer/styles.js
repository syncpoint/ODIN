import * as R from 'ramda'
import Style from 'ol/style/Style'
import Icon from 'ol/style/Icon'
import ms from 'milsymbol'


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

export const defaultStyle = symbolStyle({
  outlineWidth: 3,
  outlineColor: 'white'
})

export const highlightStyle = symbolStyle({
  outlineWidth: 6,
  outlineColor: 'black',
  monoColor: 'white'
})

import * as R from 'ramda'
import { defaultStyle } from './default-style'
import { polygonStyle } from './polygon-style'
import { lineStyle } from './line-style'
import { multipointStyle } from './multipoint-style'
import { collectionStyle } from './collection-style'
import { symbolStyle } from './symbol-style'

/**
 * normalizeSIDC :: String -> String
 */
export const normalizeSIDC = sidc => sidc
  ? `${sidc[0]}-${sidc[2]}-${sidc.substring(4, 10)}`
  : 'MUZP------*****'

/**
 * (MIL) SYMBOL STYLING.
 */



/**
 * FEATURE STYLE FUNCTION.
 */

export default context => (feature, resolution) => {
  const provider = R.cond([
    [R.equals('Point'), R.always(symbolStyle(context))],
    [R.equals('Polygon'), R.always(polygonStyle(context))],
    [R.equals('LineString'), R.always(lineStyle(context))],
    [R.equals('MultiPoint'), R.always(multipointStyle(context))],
    [R.equals('GeometryCollection'), R.always(collectionStyle(context))],
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

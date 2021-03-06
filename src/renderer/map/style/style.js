import * as R from 'ramda'
import { defaultStyle } from './default-style'
import { polygonStyle } from './polygon-style'
import { lineStyle } from './line-style'
import { multipointStyle } from './multipoint-style'
import { collectionStyle } from './collection-style'
import { symbolStyle } from './symbol-style'
import { supplementalStyle } from './supplemental'
import * as features from '../../components/feature-descriptors'

/**
 * normalizeSIDC :: String -> String
 */
export const normalizeSIDC = sidc => sidc
  ? `${sidc[0]}-${sidc[2]}-${sidc.substring(4, 10)}`
  : 'MUZP------*****'

const isGeometry = type => feature => feature.getGeometry().getType() === type
const isSymbol = feature => {
  const descriptor = features.descriptor(feature)
  if (descriptor && descriptor.geometry && descriptor.geometry.type === 'Point') return true
  else return isGeometry('Point')(feature)
}

const isSupplemental = feature => {
  const sidc = feature.get('sidc')
  return sidc && sidc.startsWith('X')
}

/** [feature -> boolean, styleFN] */
const providers = [
  [isSupplemental, supplementalStyle],
  [isSymbol, symbolStyle],
  [isGeometry('Polygon'), polygonStyle],
  [isGeometry('LineString'), lineStyle],
  [isGeometry('MultiPoint'), multipointStyle],
  [isGeometry('GeometryCollection'), collectionStyle],
  [R.T, defaultStyle]
]

export default mode => (feature, resolution) => {

  try {
    const provider = providers.find(([p]) => p(feature))
    const styles = provider[1](mode)(feature, resolution)
    return styles
  } catch (err) {
    console.error('[style]', feature, err)
    return []
  }
}

import { parameterized } from '../../components/SIDC'
import corridors from './corridors'
import { styleFactory, defaultStyle } from './default-style'

export const collectionStyle = mode => (feature, resolution) => {
  const sidc = parameterized(feature.get('sidc'))
  const factory = styleFactory({ mode, feature, resolution })
  const options = { feature, resolution, styleFactory: factory }
  if (corridors[sidc]) return corridors[sidc](options).flat()
  else return defaultStyle(feature, resolution).flat()
}

import { parameterized } from '../../components/SIDC'
import corridors from './corridors'
import { styleFactory, defaultStyle } from './default-style-2'

export const collectionStyle = mode => (feature, resolution) => {
  const sidc = parameterized(feature.get('sidc'))
  const options = { feature, resolution, styleFactory: styleFactory(mode, feature) }
  if (corridors[sidc]) return corridors[sidc](options).flat()
  else return defaultStyle(feature, resolution).flat()
}

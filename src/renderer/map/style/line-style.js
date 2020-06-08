import defaultStyle from './default-style'
import { parameterized } from '../../components/SIDC'
import { labels } from './line-labels'
import { geometries } from './line-geometries'

export const lineStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const labelFns = labels[sidc] || []
  const geometryFns = geometries[sidc] || defaultStyle
  return [geometryFns, ...labelFns].flatMap(fn => fn(feature, resolution))
}

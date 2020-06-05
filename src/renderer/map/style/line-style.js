import defaultStyle from './default-style'
import { parameterized } from '../../components/SIDC'
import { labels } from './line-labels'

export const lineStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const labelFns = labels[sidc] || []
  const styleFns = [defaultStyle, ...labelFns]
  return styleFns.flatMap(fn => fn(feature, resolution))
}

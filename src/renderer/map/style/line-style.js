/* eslint-disable */
import defaultStyle from './default-style'
import { parameterized } from '../../components/SIDC'
import lineLabels from './line-labels'


const templates = {
  'G*G*GLL---': title => [lineLabels(({ t }) => ([title, t ? `(PL ${t})` : '']))]
}

const labels = {
  'G*G*GLL---': templates['G*G*GLL---']('LL')
}

export const lineStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const labelFns = labels[sidc] || []
  const styleFns = [defaultStyle, ...labelFns]
  return styleFns.flatMap(fn => fn(feature, resolution))
}

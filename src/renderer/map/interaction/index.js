import { descriptor } from '../../components/feature-descriptors'
import corridor from './corridor'
import fan from './fan'
import seize from './seize'

const key = descriptor =>
  descriptor
    ? descriptor.geometry && descriptor.geometry.layout
      ? `${descriptor.geometry.type}-${descriptor.geometry.layout}`
      : `${descriptor.geometry.type}`
    : undefined

const framers = {
  'GeometryCollection-corridor': corridor,
  'MultiPoint-fan': fan,
  'MultiPoint-seize': seize
}

export const framer = feature => framers[key(descriptor(feature))]

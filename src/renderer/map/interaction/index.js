import { descriptor } from '../../components/feature-descriptors'
import corridor from './corridor'
import fan from './fan'
import { geometryType } from './feature'

const key = descriptor =>
  descriptor
    ? descriptor.geometry && descriptor.geometry.layout
      ? `${descriptor.geometry.type}-${descriptor.geometry.layout}`
      : `${descriptor.geometry.type}`
    : undefined

export const framer = feature => {
  const framers = {
    '[LineString,Point]': corridor,
    MultiPoint: fan
  }

  console.log(key(descriptor(feature)))
  const type = geometryType(feature.getGeometry())
  return framers[type]
}


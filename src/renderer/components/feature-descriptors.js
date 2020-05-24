import * as R from 'ramda'
import descriptors from './feature-descriptors.json'
import { K } from '../../shared/combinators'
import { parameterized } from './SIDC'

const features = descriptors.reduce((acc, descriptor) => K(acc)(acc => {
  acc[parameterized(descriptor.sidc)] = {
    class: descriptor.class,
    geometry: descriptor.geometry,
    hierarchy: R.drop(1, descriptor.hierarchy).join(', ')
  }
}), {})

const featureClass = sidc => {
  const feature = features[parameterized(sidc)]
  return feature ? feature.class : undefined
}

export default {
  featureClass
}

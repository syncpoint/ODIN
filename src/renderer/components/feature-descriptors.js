import * as R from 'ramda'
import descriptors from './feature-descriptors.json'
import { K } from '../../shared/combinators'

/**
 * parameterizedSIDC :: string -> string
 * NOTE: Parameterized SIDC is limited to first 10 characters.
 */
const parameterizedSIDC =
  sidc =>
    `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`

const features = descriptors.reduce((acc, descriptor) => K(acc)(acc => {
  acc[parameterizedSIDC(descriptor.sidc)] = {
    class: descriptor.class,
    geometry: descriptor.geometry,
    hierarchy: R.drop(1, descriptor.hierarchy).join(', ')
  }
}), {})

const featureClass = sidc => {
  const feature = features[parameterizedSIDC(sidc)]
  return feature ? feature.class : undefined
}

export default {
  featureClass
}

import * as R from 'ramda'
import descriptors from './feature-descriptors.json'
import { K } from '../../shared/combinators'
import { parameterized } from './SIDC'


const lookup = descriptors.reduce((acc, descriptor) => K(acc)(acc => {
  const sidc = parameterized(descriptor.sidc)
  acc[sidc] = {
    sidc,
    class: descriptor.class,
    geometry: descriptor.geometry,
    hierarchy: R.drop(1, descriptor.hierarchy).join(', ')
  }
}), {})

const sortedList = descriptors
  .filter(descriptor => descriptor.class)
  .map(descriptor => ({
    sidc: descriptor.sidc,
    class: descriptor.class,
    geometry: descriptor.geometry,
    name: descriptor.hierarchy[descriptor.hierarchy.length - 1],
    hierarchy: R.take(descriptor.hierarchy.length - 2, R.drop(1, descriptor.hierarchy)).join(', '),
    sortkey: descriptor.hierarchy.join(', ')
  }))
  .sort((a, b) => a.sortkey.localeCompare(b.sortkey))


/**
 * featureClass :: string -> string
 */
const featureClass = sidc => {
  const feature = lookup[parameterized(sidc)]
  return feature ? feature.class : undefined
}

/**
 * featureDescriptors :: () => [object]
 */
const featureDescriptors = () => sortedList

export default {
  featureClass,
  featureDescriptors
}

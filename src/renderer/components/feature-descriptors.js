import * as R from 'ramda'
import descriptors from './feature-descriptors.json'
import { K } from '../../shared/combinators'
import {
  parameterized,
  schemaPart,
  hostilityPart,
  // battleDimensionPart,
  statusPart,
  installationPart
} from './SIDC'

const lookup = descriptors.reduce((acc, descriptor) => K(acc)(acc => {
  const sidc = parameterized(descriptor.sidc)
  acc[sidc] = {
    sidc,
    class: descriptor.class,
    geometry: {
      type: descriptor.geometry,
      ...descriptor.parameters
    },
    hierarchy: R.drop(1, descriptor.hierarchy).join(', ')
  }
}), {})

const sortedList = descriptors
  .map(descriptor => ({
    sidc: descriptor.sidc,
    class: descriptor.class,
    geometry: descriptor.geometry,
    ...descriptor.parameters,
    name: descriptor.hierarchy[descriptor.hierarchy.length - 1],
    hierarchy: R.take(descriptor.hierarchy.length - 2, R.drop(1, descriptor.hierarchy)).join(', '),
    sortkey: descriptor.hierarchy.join(', ').toLowerCase()
  }))
  .sort((a, b) => a.sortkey.localeCompare(b.sortkey))

/**
 * featureClass :: string -> string
 */
export const featureClass = sidc => {
  const feature = lookup[parameterized(sidc)]
  return feature ? feature.class : undefined
}

export const featureGeometry = sidc => {
  const feature = lookup[parameterized(sidc)]
  return feature ? feature.geometry : undefined
}

/**
 * featureDescriptors :: () => [object]
 */
export const featureDescriptors = (filter, preset = {}) => {
  // if (!filter || filter.length < 3) return []

  const schema = preset.schema || 'S'
  const hostlility = preset.hostility || 'F'
  // const battleDimension = preset.battleDimension || 'G'
  const status = preset.status || 'P'
  const installation = preset.installation || '-'

  const schemaMatch = descr => schemaPart.value(descr.sidc) === schema
  // const battleDimensionMatch = descr => battleDimensionPart.value(descr.sidc) === battleDimension
  const filterMatch = descr => descr.sortkey.includes(filter.toLowerCase())
  const installationMatch = descr => [installation, '*'].includes(installationPart.value(descr.sidc))
  const match = descr =>
    schemaMatch(descr) &&
    // battleDimensionMatch(descr) &&
    filterMatch(descr) &&
    installationMatch(descr)

  const installationModifier = sidc => installationPart.value(sidc) !== '*'
    ? sidc
    : installationPart.replace(installation)(sidc)

  const sidc = R.compose(
    installationModifier,
    hostilityPart.replace(hostlility),
    statusPart.replace(status)
  )

  const updateSIDC = descriptor => ({ ...descriptor, sidc: sidc(descriptor.sidc) })
  const matches = sortedList
    .filter(match)
    .map(updateSIDC)
  // console.log('## matches', matches.length)
  return matches
}

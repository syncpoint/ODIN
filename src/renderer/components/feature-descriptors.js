import * as R from 'ramda'
import descriptors from './feature-descriptors.json'
import { K } from '../../shared/combinators'
import { parameterized, hostilityPart, statusPart, installationPart } from './SIDC'

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
  .map(descriptor => ({
    sidc: descriptor.sidc,
    class: descriptor.class,
    geometry: descriptor.geometry,
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

const supportedGeometries = ['point', 'polygon', 'line', 'line-2pt']

/**
 * featureDescriptors :: () => [object]
 */
export const featureDescriptors = (filter, preset = {}) => {
  if (!filter || filter.length < 3) return []

  const hostlility = preset.hostility || 'F'
  const status = preset.status || 'P'
  const installation = preset.installation || '-'

  const filterMatch = descr => descr.sortkey.includes(filter.toLowerCase())
  const installationMatch = descr => [installation, '*'].includes(installationPart.value(descr.sidc))
  const match = descr => filterMatch(descr) && installationMatch(descr)
  const supported = descr => supportedGeometries.includes(descr.geometry)

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
    .filter(supported)
    .filter(match)
    .map(updateSIDC)
  return R.take(50, matches)
}

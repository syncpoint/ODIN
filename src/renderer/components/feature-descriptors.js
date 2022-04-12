import * as R from 'ramda'
import descriptors from './feature-descriptors.json'
import { K } from '../../shared/combinators'
import lunr from 'lunr'
import {
  parameterized,
  hostilityPart,
  statusPart
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
    hierarchy: R.take(descriptor.hierarchy.length - 1, descriptor.hierarchy).join(', '),
    sortkey: descriptor.hierarchy.join(', ').toLowerCase()
  }))
  .sort((a, b) => a.sortkey.localeCompare(b.sortkey))

const document = ({ sidc, hierarchy, scope, dimension }) => ({
  sidc,
  title: hierarchy[hierarchy.length - 1],
  body: R.take(hierarchy.length - 1, hierarchy).join(' '),
  scope,
  dimension
})

const index = lunr(function () {
  // TODO: remove 'so' (stability operations) from stop word list.
  // Stemmer makes more harm than good in our case.
  this.pipeline.remove(lunr.stemmer)
  this.searchPipeline.remove(lunr.stemmer)

  this.metadataWhitelist = ['position']
  this.ref('sidc')
  this.field('title')
  this.field('body')
  this.field('scope')
  this.field('dimension')

  descriptors
    .map(document)
    .forEach(document => this.add(document))
})

/**
 * featureClass :: string -> string
 */
export const featureClass = sidc => {
  if (!sidc) return undefined
  const feature = lookup[parameterized(sidc)]
  return feature ? feature.class : undefined
}

export const featureGeometry = sidc => {
  if (!sidc) return undefined
  const feature = lookup[parameterized(sidc)]
  return feature ? feature.geometry : undefined
}

export const geometry = featureGeometry // alias

export const descriptor = feature => {
  if (!feature) return
  if (!feature.get('sidc')) return
  return lookup[parameterized(feature.get('sidc'))]
}

/**
 * featureDescriptors :: () => [object]
 */
export const featureDescriptors = (filter, preset = {}) => {
  const hostlility = preset.hostility || 'F'
  const status = preset.status || 'P'
  const sidc = R.compose(
    hostilityPart.replace(hostlility),
    statusPart.replace(status)
  )

  const updateSIDC = descriptor => {
    /*
    HAL@12apr22:
    classes K and KU are used for Austria's SKKM symbols
    */
    if (descriptor.class === 'K') {
      return descriptor
    } else if (descriptor.class === 'KU') {
      return ({ ...descriptor, sidc: hostilityPart.replace('F')(descriptor.sidc) })
    } else {
      return { ...descriptor, sidc: sidc(descriptor.sidc) }
    }
  }

  try {
    return index.search(filter)
      .map(item => sortedList.find(descriptor => descriptor.sidc === item.ref))
      .map(updateSIDC)
  } catch (err) {
    console.error(err)
    return []
  }
}

export const maxPoints = sidc => {
  if (!sidc) return undefined
  const descriptor = lookup[parameterized(sidc)]
  if (!descriptor || !descriptor.geometry) return undefined

  if (descriptor.geometry.layout === 'orbit') return 2
  else return descriptor.geometry.maxPoints
}

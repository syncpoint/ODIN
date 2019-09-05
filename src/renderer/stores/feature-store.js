import featureDescriptors from './feature-descriptors.json'
import lunr from 'lunr'

const features = featureDescriptors.map(feature => {
  const { hierarchy } = feature
  const title = hierarchy[hierarchy.length - 1]
  const body = hierarchy.slice(1, hierarchy.length - 1).join(', ')

  return {
    // Limit SIDC to first 10 characters:
    sidc: feature.sidc.substring(0, 10),
    name: title,
    info: body,
    geometries: feature.geometries
  }
})

const documents = () => features.map((element, index) => (
  { id: index, title: element.name, body: element.info }
))

const index = lunr(function () {
  this.field('title')
  this.field('body')
  this.ref('id')

  documents().forEach(doc => this.add(doc))
})

export const findSpecificItem = sidc => {
  const genericSIDC = sidc[0] + '*' + sidc[2] + '*' + sidc.substring(4, 10)
  return features.find(feature => feature.sidc === genericSIDC)
}

export const search = term => {
  const rows = term === '' ? [] : index.search(term)
  return rows.map(row => features[row.ref]).slice(0, 50)
}

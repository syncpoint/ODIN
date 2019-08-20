/* eslint-disable */
const lunr = require('lunr')
import featureDescriptors from './feature-descriptors.json'

const features = featureDescriptors.map(feature => {
  const { hierarchy } = feature
  const title = hierarchy[hierarchy.length - 1]
  const body = hierarchy.slice(1, hierarchy.length - 1).join(', ')

  return {
    sidc: feature.sidc,
    name: title,
    info: body
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

const findSpecificItem = sidc => {
  const genericSIDC = sidc => sidc[0] + '*' + sidc[2] + '*' + sidc.substring(4)
  return features.find(symbol => symbol.sidc === genericSIDC(sidc))
}

const search = term => {
  const rows = term === '' ? [] : index.search(term)
  return rows.map(row => features[row.ref]).slice(0, 50)
}

export { findSpecificItem, search }


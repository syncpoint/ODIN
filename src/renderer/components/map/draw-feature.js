import uuid from 'uuid-random'
import ms from 'milsymbol'
import evented from '../../evented'
import layerStore from '../../stores/layer-store'
import { findSpecificItem } from '../../stores/feature-store'
import { ResourceNames } from '../../model/resource-names'
import selection from '../App.selection'

const geometryType = (descriptor, sidc) => {
  const includes = type => descriptor.geometries.includes(type)
  const validSymbol = () => new ms.Symbol(sidc, {}).isValid()

  // Usually a point, but not always:
  if (!descriptor.geometries) return validSymbol() ? 'point' : null
  if (descriptor.geometries.length === 1) return descriptor.geometries[0]

  // Guess-work...
  if (includes('point') && validSymbol()) return 'point'

  return null
}

const geometry = (geometryType, latlngs, properties) => {
  if (geometryType === 'point') return { type: 'Point', coordinates: [latlngs.lng, latlngs.lat] }
  const lineString = () => latlngs.map(({ lat, lng }) => [lng, lat])
  const polygon = () => [lineString()]

  switch (geometryType) {
    case 'polygon': return { type: 'Polygon', coordinates: polygon() }
    case 'line': return { type: 'LineString', coordinates: lineString() }
    case 'corridor': return { type: 'LineString', coordinates: lineString(), ...properties }
    case 'corridor-2pt': return { type: 'LineString', coordinates: lineString(), ...properties }
  }
}


const point = (type, sidc) => evented.emit('tools.pick-point', {
  prompt: 'Pick a location...',
  picked: latlng => {
    const featureId = uuid()
    selection.preselect(ResourceNames.featureId('0', featureId))
    layerStore.addFeature(0)(featureId, {
      type: 'Feature',
      geometry: geometry(type, latlng),
      properties: { sidc }
    })
  }
})


const line = (type, sidc) => evented.emit('tools.draw', {
  geometryType: type,
  prompt: `Draw a ${type}...`,
  done: latlngs => {
    const featureId = uuid()
    selection.preselect(ResourceNames.featureId('0', featureId))
    layerStore.addFeature(0)(featureId, {
      type: 'Feature',
      geometry: geometry(type, latlngs),
      properties: { sidc }
    })
  }
})


const corridor = (type, sidc) => evented.emit('tools.draw', {
  geometryType: type,
  prompt: `Draw a ${type}...`,
  done: latlngs => {
    const featureId = uuid()
    selection.preselect(ResourceNames.featureId('0', featureId))
    layerStore.addFeature(0)(featureId, {
      type: 'Feature',
      geometry: geometry(type, latlngs),
      properties: { sidc, geometry_width: 1000 }
    })
  }
})


const corridor2Point = (type, sidc) => evented.emit('tools.draw', {
  geometryType: 'line-2pt',
  prompt: `Draw a corridor (2 points)...`,
  done: latlngs => {
    const featureId = uuid()
    selection.preselect(ResourceNames.featureId('0', featureId))
    layerStore.addFeature(0)(featureId, {
      type: 'Feature',
      geometry: geometry(type, latlngs),
      properties: { sidc, geometry_width: 1000 }
    })
  }
})


const handlers = {
  point,
  line,
  polygon: line,
  corridor,
  'corridor-2pt': corridor2Point
}


export default sidc => {

  // TODO: move to GeoJSON/Feature/SIDC helper.
  const genericSIDC = sidc[0] + '*' + sidc[2] + '*' + sidc.substring(4, 15)
  const featureDescriptor = findSpecificItem(genericSIDC)
  const type = geometryType(featureDescriptor, sidc)

  const geometryHint = () => evented.emit('OSD_MESSAGE', {
    message: `Sorry, the feature's geometry is not supported, yet.`,
    duration: 5000
  })

  if (!type) return geometryHint()
  handlers[type](type, sidc)
}

import uuid from 'uuid-random'
import ms from 'milsymbol'
import evented from '../../evented'
import layerStore from '../../stores/layer-store'
import { findSpecificItem } from '../../stores/feature-store'
import { ResourceNames } from '../../model/resource-names'
import selection from '../App.selection'
import { toGeometry } from '../../leaflet/GeoJSON'

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


const point = (type, sidc) => evented.emit('tools.pick-point', {
  prompt: 'Pick a location...',
  picked: latlng => {
    const featureId = uuid()
    selection.preselect(ResourceNames.featureId('0', featureId))
    layerStore.addFeature(0)(featureId, {
      type: 'Feature',
      geometry: toGeometry('Point', latlng),
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
      geometry: toGeometry('LineString', latlngs),
      properties: { sidc }
    })
  }
})

const line2Point = (type, sidc) => evented.emit('tools.draw', {
  geometryType: 'line-2pt',
  prompt: `Draw a line (2 points)...`,
  done: latlngs => {
    const featureId = uuid()
    selection.preselect(ResourceNames.featureId('0', featureId))
    layerStore.addFeature(0)(featureId, {
      type: 'Feature',
      geometry: toGeometry('LineString', latlngs),
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
      geometry: toGeometry('LineString', latlngs),
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
      geometry: toGeometry('LineString', latlngs),
      properties: { sidc, geometry_width: 1000 }
    })
  }
})

const arc = size => (type, sidc) => evented.emit('tools.pick-point', {
  prompt: 'Pick a location...',
  picked: latlng => {
    const featureId = uuid()
    selection.preselect(ResourceNames.featureId('0', featureId))
    layerStore.addFeature(0)(featureId, {
      type: 'Feature',
      geometry: toGeometry('Point', latlng),
      properties: {
        sidc,
        'geometry_max_range': 500,
        'geometry_mnm_range': 0,
        'geometry_size_angle': size,
        'geometry_orient_angle': 90
      }
    })
  }
})

const fan = (type, sidc) => evented.emit('tools.pick-point', {
  prompt: 'Pick a location...',
  picked: latlng => {
    const featureId = uuid()
    selection.preselect(ResourceNames.featureId('0', featureId))
    layerStore.addFeature(0)(featureId, {
      type: 'Feature',
      geometry: toGeometry('Point', latlng),
      properties: {
        sidc,
        'geometry_mnm_range': 500,
        'geometry_max_range': 750,
        'geometry_size_angle': 45,
        'geometry_orient_angle': 90
      }
    })
  }
})

const seize = (type, sidc) => evented.emit('tools.pick-point', {
  prompt: 'Pick a location...',
  picked: latlng => {
    const featureId = uuid()
    selection.preselect(ResourceNames.featureId('0', featureId))
    layerStore.addFeature(0)(featureId, {
      type: 'Feature',
      geometry: toGeometry('Point', latlng),
      properties: {
        sidc,
        'geometry_mnm_range': 500,
        'geometry_max_range': 750,
        'geometry_size_angle': 90,
        'geometry_orient_angle': 0
      }
    })
  }
})

const orbit = (type, sidc) => evented.emit('tools.draw', {
  geometryType: 'line-2pt',
  prompt: `Draw a line (2 points)...`,
  done: latlngs => {
    const featureId = uuid()
    selection.preselect(ResourceNames.featureId('0', featureId))
    layerStore.addFeature(0)(featureId, {
      type: 'Feature',
      geometry: toGeometry('MultiPoint', latlngs),
      properties: { sidc, geometry_width: 500, geometry_aligbment: 'RIGHT' }
    })
  }
})

const handlers = {
  point,
  'line-2pt': line2Point,
  line,
  polygon: line,
  corridor,
  'corridor-2pt': corridor2Point,
  'fan-90': seize,
  'fan-338': arc(338),
  'fan-330': arc(330),
  fan,
  orbit
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
  ;(handlers[type] || (() => console.log('unsupported', type)))(type, sidc)
}

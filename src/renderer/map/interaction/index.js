import Feature from 'ol/Feature'
import * as geom from 'ol/geom'
import * as Descriptors from '../../components/feature-descriptors'
import corridor from './corridor'
import fan from './fan'
import seize from './seize'

const geometryType = arg => {
  // OpenLayers:
  if (arg instanceof Feature) return geometryType(arg.getGeometry())
  else if (arg instanceof geom.GeometryCollection) return arg.getGeometries().map(geometryType).join(':')
  else if (arg instanceof geom.Geometry) return arg.getType()
  // GeoJSON:
  else if (arg.type === 'GeometryCollection') return arg.geometries.map(geometryType).join(':')
  else if (arg.type) return arg.type
  else return null
}

const framers = {
  'LineString:Point-corridor': corridor,
  'LineString:Point-orbit': corridor,
  'MultiPoint-fan': fan,
  'MultiPoint-seize': seize
}

export const framer = feature => {
  const descriptor = Descriptors.descriptor(feature)
  const layout = descriptor && descriptor.geometry.layout
  const key = layout
    ? `${geometryType(feature)}-${layout}`
    : `${geometryType(feature)}`

  return framers[key]
}

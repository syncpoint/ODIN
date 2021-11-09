import Feature from 'ol/Feature'
import * as geom from 'ol/geom'
import * as MILSTD from '../../components/feature-descriptors'
import corridor from './corridor'
import fan from './fan'
import rectangle from './rectangle'

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

const layouts = {
  'LineString:Point-corridor': corridor,
  'MultiPoint-fan': fan,
  'LineString:Point-orbit': corridor,
  'Polygon-rectangle': rectangle
}

const defaultBehavior = (feature, descriptor) => ({
  capture: (_, vertex) => vertex,
  roles: () => ['DEFAULT'],
  geometry: () => feature.getGeometry(),
  updateCoordinates: (_, coordinates) => feature.getGeometry().setCoordinates(coordinates),
  suppressVertexFeature: () => {
    if (!descriptor) return false
    if (descriptor.type === feature.getGeometry().getType() && descriptor.maxPoints === 2) return true
    return false
  }
})

export const special = (feature, overlay) => {
  const geometry = MILSTD.featureGeometry(feature.get('sidc'))
  const key = geometry && geometry.layout
    ? `${geometryType(feature)}-${geometry.layout}`
    : `${geometryType(feature)}`

  return layouts[key]
    ? layouts[key](feature, geometry, overlay)
    : defaultBehavior(feature, geometry)
}

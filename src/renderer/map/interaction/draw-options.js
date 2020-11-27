import * as geom from 'ol/geom'
import GeometryType from 'ol/geom/GeometryType'
import * as G from '../style/geodesy'
import * as TS from '../ts'
import { format } from '../format'

/**
 * Geometry-specific options for Draw interaction.
 * Each option object provides:
 *    match :: FeatureDescriptor -> boolean - whether this option applies to feature descriptor
 *    options :: FeatureDescriptor -> (string ~> any) - actual options passed to interaction
 *    complete :: (ol/Map, ol/Feature) -> unit - optionally rewrite feature's geometry
 */

export const drawOptions = [

  /* Point. */
  {
    match: descriptor => descriptor.geometry === GeometryType.POINT,
    options: () => ({ type: GeometryType.POINT })
  },

  /* Polygon. */
  {
    match: descriptor => descriptor.geometry === GeometryType.POLYGON,
    options: () => ({ type: GeometryType.POLYGON })
  },

  /* LineString. */
  {
    match: descriptor => descriptor.geometry === GeometryType.LINE_STRING,
    options: descriptor => ({ type: GeometryType.LINE_STRING, maxPoints: descriptor.maxPoints })
  },

  /* GeometryCollection/orbit. */
  {
    match: descriptor => descriptor.layout === 'orbit',
    options: () => ({ type: GeometryType.LINE_STRING, maxPoints: 2 }),
    complete: (_, feature) => {
      const line = feature.getGeometry()
      const linePoints = G.coordinates(line).map(G.toLatLon)
      const [bearing, distance] = G.bearingLine(linePoints)
      const C = linePoints[0].destinationPoint(distance / 2, bearing + 90)
      const point = new geom.Point(G.fromLatLon(C))
      feature.setGeometry(new geom.GeometryCollection([line, point]))
    }
  },

  /* MultiPoint/fan (2-point) */
  {
    match: descriptor => descriptor.layout === 'fan' && Number.parseInt(descriptor.maxPoints) === 3,
    options: () => ({ type: GeometryType.POINT }),
    complete: (map, feature) => {
      const resolution = map.getView().getResolution()
      const point = feature.getGeometry()
      const C = G.toLatLon(G.coordinates(point))
      const A = C.destinationPoint(resolution * 50, 0)
      const B = C.destinationPoint(resolution * 50, 90)
      feature.setGeometry(new geom.MultiPoint([G.fromLatLon(C), G.fromLatLon(A), G.fromLatLon(B)]))
    }
  },

  /* MultiPoint/fan (3-point) */
  {
    match: descriptor => descriptor.layout === 'fan' && Number.parseInt(descriptor.maxPoints) === 2,
    options: () => ({ type: GeometryType.POINT }),
    complete: (map, feature) => {
      const resolution = map.getView().getResolution()
      const point = feature.getGeometry()
      const C = G.toLatLon(G.coordinates(point))
      const A = C.destinationPoint(resolution * 50, 0)
      feature.setGeometry(new geom.MultiPoint([G.fromLatLon(C), G.fromLatLon(A)]))
    }
  },

  /* GeometryCollection/corridor (2-/n-point) */
  {
    match: descriptor => descriptor.layout === 'corridor',
    options: descriptor => ({ type: GeometryType.LINE_STRING, maxPoints: descriptor.maxPoints }),
    complete: (map, feature) => {
      const geometry = feature.getGeometry()
      const reference = geometry.getFirstCoordinate()
      const { read, write } = format(reference)
      const line = read(geometry)

      const min = (a, b) => Math.min(a, b)
      const segments = TS.segments(line)
      const minLength = segments.map(segment => segment.getLength()).reduce(min)
      const width = Math.min(minLength / 4, map.getView().getResolution() * 50)
      const A = TS.coordinate(TS.startPoint(line))
      const angle = segments[0].angle() - Math.PI / 2
      const point = TS.point(TS.projectCoordinate(A)([angle, width / 2]))
      feature.setGeometry(write(TS.geometryCollection([line, point])))
    }
  }
]

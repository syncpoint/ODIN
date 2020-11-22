import * as R from 'ramda'
import * as jsts from 'jsts'
import * as geom from 'ol/geom'

const K = v => fn => { fn(v); return v }

/**
 * CAP_ROUND: 1 (DEFAULT)
 * CAP_FLAT: 2
 * CAP_SQUARE: 3 (aka CAP_BUTT)
 *
 * JOIN_ROUND: 1
 * JOIN_MITRE: 2
 * JOIN_BEVEL: 3
 *
 * DEFAULT_MITRE_LIMIT: 5
 * DEFAULT_QUADRANT_SEGMENTS: 8
 * DEFAULT_SIMPLIFY_FACTOR: 0.01
 *
 * REFERENCE: https://locationtech.github.io/jts/javadoc/org/locationtech/jts/operation/buffer/BufferParameters.html
 */
export const BufferParameters = jsts.operation.buffer.BufferParameters

/**
 * NOTE: jst/Geometry#buffer() only exposes partial BufferOp/BufferParameters API.
 */
const BufferOp = jsts.operation.buffer.BufferOp
export const MinimumDiameter = jsts.algorithm.MinimumDiameter
export const Angle = jsts.algorithm.Angle
export const GeometryFactory = jsts.geom.GeometryFactory
export const AffineTransformation = jsts.geom.util.AffineTransformation
export const Coordinate = jsts.geom.Coordinate

export const geometryFactory = new GeometryFactory()

/**
 * Setup JST/OL parser to convert between JST and OL geometries.
 * REFERENCE: http://bjornharrtell.github.io/jsts/1.6.1/doc/module-org_locationtech_jts_io_OL3Parser.html
 */
const parser = K(new jsts.io.OL3Parser(geometryFactory))(parser => parser.inject(
  geom.Point,
  geom.LineString,
  geom.LinearRing,
  geom.Polygon,
  geom.MultiPoint,
  geom.MultiLineString,
  geom.MultiPolygon,
  geom.GeometryCollection
))

/**
 * JSTS ignores the fact that ol.geom.LinearRing is not supposed to be rendered.
 * We convert LinearRing to equivalent LineString.
 */
/* eslint-disable no-proto */
const convertToLinearRing = parser.__proto__.convertToLinearRing
parser.__proto__.convertToLinearRing = function (linearRing) {
  const geometry = convertToLinearRing.call(this, linearRing)
  return new geom.LineString(geometry.getCoordinates())
}

export const read = olGeometry => parser.read(olGeometry)
export const write = jstGeometry => parser.write(jstGeometry)

export const buffer = (opts = {}) => geometry => distance => {
  // NOTE: 3-ary form not supported, use either 0, 1, 2 or 4 arguments.
  // SEE: https://locationtech.github.io/jts/javadoc/org/locationtech/jts/operation/buffer/BufferParameters.html
  const params = new BufferParameters(
    opts.quadrantSegments || BufferParameters.DEFAULT_QUADRANT_SEGMENTS,
    opts.endCapStyle || BufferParameters.CAP_ROUND,
    opts.joinStyle || BufferParameters.JOIN_BEVEL,
    opts.mitreLimit || BufferParameters.DEFAULT_MITRE_LIMIT
  )

  return BufferOp.bufferOp(geometry, distance, params)
}

export const pointBuffer = buffer()
export const lineBuffer = buffer({
  joinStyle: BufferParameters.JOIN_ROUND,
  endCapStyle: BufferParameters.CAP_FLAT
})

export const polygon = coordinates => geometryFactory.createPolygon(coordinates)
export const lineString = coordinates => geometryFactory.createLineString(coordinates)
export const point = coordinate => geometryFactory.createPoint(coordinate)
export const multiPoint = points => geometryFactory.createMultiPoint(points)
export const lineSegment = ([p0, p1]) => new jsts.geom.LineSegment(p0, p1)
export const geometryCollection = geometries => geometryFactory.createGeometryCollection(geometries)
export const coordinates = geometries => geometries.flatMap(geometry => geometry.getCoordinates())
export const coordinate = geometry => geometry.getCoordinate()
export const boundary = geometry => geometry.getBoundary()
export const boundaries = geometries => geometries.map(boundary)
export const union = geometries => geometries.reduce((a, b) => a.union(b))
export const difference = geometries => geometries.reduce((a, b) => a.difference(b))
export const intersection = geometries => geometries.reduce((a, b) => a.intersection(b))
export const geometryN = n => geometry => geometry.getGeometryN(n)
export const geometry0 = geometryN(0)
export const startPoint = geometry => geometry.getStartPoint()
export const endPoint = geometry => geometry.getEndPoint()
export const linePoints = line => R.range(0, line.getNumPoints()).map(i => line.getPointN(i))
export const minimumRectangle = geometry => MinimumDiameter.getMinimumRectangle(geometry)
export const endCoordinate = R.compose(coordinate, endPoint)

export const geometries = geometryCollection => R
  .range(0, geometryCollection.getNumGeometries())
  .map(i => geometryCollection.getGeometryN(i))

export const translate = (angle, geometry) => distance => {
  const α = 2 * Math.PI - angle
  const [tx, ty] = [-Math.cos(α) * distance, Math.sin(α) * distance]
  const transform = AffineTransformation.translationInstance(tx, ty)
  const translated = geometry.copy()
  translated.apply(transform)
  return translated
}

// CCW angle with x-axis [-π ,π] => CW angle with azimuth [0, 2π]
export const angleAzimuth = α => Angle.PI_TIMES_2 - Angle.normalizePositive(α - Angle.PI_OVER_2)

export const projectCoordinate = (angle, distance) => ({ x, y }) => new Coordinate(
  x + Math.cos(angle) * distance,
  y + Math.sin(angle) * distance
)

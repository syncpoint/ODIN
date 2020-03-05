/* eslint-disable */
import { GEOS, InverseRadians, proj, projectPoint, HALF_PI } from './geos-utils'

const getPoints = lineString => {
  const points = []
  const numPoints = lineString.getNumPoints()
  for (let i = 0; i < numPoints; i++) {
    points.push(lineString.getPointN(i))
  }

  return points
}

export default (wkt, width) => {
  const geometry = GEOS.readWKT(wkt)
  const POINTS = getPoints(geometry)

  const BUFFER = geometry
    .transform((x, y) => proj.forward([x, y]))
    .buffer(width, 16, GEOS.CAP_FLAT, GEOS.JOIN_ROUND)
    .transform((x, y) => proj.inverse([x, y]))

  // TODO: handle special case
  if (POINTS.length < 3) return BUFFER

  const L_CENTER = GEOS.createLineString(POINTS.slice(0, POINTS.length - 1))

  const P_A = geometry.getPointN(-2) // point before last
  const P_B = geometry.getPointN(-1) // last point
  const L_AB = GEOS.createLineString([P_A, P_B]) // last segment
  const { azimuth: ALPHA, distanceSphere: D_AB } = InverseRadians(P_A, P_B)

  const ARROW_LENGTH = 0.76 * width
  const ARROW_L_AB_RATIO = ARROW_LENGTH / D_AB
  const P_C = L_AB.interpolateNormalized(1 - ARROW_L_AB_RATIO)

  // Extend last segment a bit to ease clipping:
  const P_F = projectPoint(P_B, ARROW_LENGTH * 1.1, ALPHA)

  // LAST SEGMENT:
  const P_D = L_CENTER.getPointN(-2)
  const P_E = L_CENTER.getPointN(-1)
  const { azimuth: BETA } = InverseRadians(P_D, P_E)
  const ZETA = (ALPHA + BETA) / 2
  const P_E1 = projectPoint(P_E, width, ZETA - HALF_PI)
  const P_E2 = projectPoint(P_E, width, ZETA + HALF_PI)

  const L_CLIP = GEOS.createCollection([
    projectPoint(P_F, width, ALPHA - HALF_PI),
    projectPoint(P_F, width, ALPHA + HALF_PI),
    P_E2,
    P_E1
  ]).convexHull()

  const I_E12 = BUFFER.intersection(GEOS.createLineString([P_E1, P_E2]))

  // Self-intersecting polygon is fixed later on (asValid()).
  const ARROW = GEOS.createLineString([
    P_B,
    projectPoint(P_C, width, ALPHA - HALF_PI),
    projectPoint(P_C, width / 2, ALPHA - HALF_PI),
    I_E12.getPointN(1),
    I_E12.getPointN(0),
    projectPoint(P_C, width / 2, ALPHA + HALF_PI),
    projectPoint(P_C, width, ALPHA + HALF_PI),
    P_B
  ]).asPolygon().asValid()

  return BUFFER.difference(L_CLIP).union(ARROW)
}

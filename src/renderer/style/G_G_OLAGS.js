import { GEOS, InverseRadians, proj, projectPoint, HALF_PI } from './geos-utils'

export default (wkt, width) => {
  const halfWidth = width / 2
  const geometry = GEOS.readWKT(wkt)
  const P_A = geometry.getPointN(-2) // point before last
  const P_B = geometry.getPointN(-1) // last point
  const L_AB = GEOS.createLineString([P_A, P_B]) // last segment
  const { azimuth: ALPHA, distanceSphere: D_AB } = InverseRadians(P_A, P_B)
  const ARROW_LENGTH = 0.76 * width
  const ARROW_L_AB_RATIO = ARROW_LENGTH / D_AB
  const P_C = L_AB.interpolateNormalized(1 - ARROW_L_AB_RATIO)

  const BUFFER = geometry
    .transform((x, y) => proj.forward([x, y]))
    .buffer(width, 16, GEOS.CAP_FLAT, GEOS.JOIN_ROUND)
    .transform((x, y) => proj.inverse([x, y]))

  const CUTOUT = GEOS.createLineString([
    projectPoint(P_B, halfWidth, ALPHA - HALF_PI),
    projectPoint(P_B, halfWidth, ALPHA + HALF_PI)
  ])
    .transform((x, y) => proj.forward([x, y]))
    .buffer(width, 16, GEOS.CAP_SQUARE, GEOS.JOIN_ROUND)
    .transform((x, y) => proj.inverse([x, y]))

  const ARROW = GEOS.createLineString([
    P_B,
    projectPoint(P_C, width, ALPHA - HALF_PI),
    projectPoint(P_C, width, ALPHA + HALF_PI),
    P_B
  ]).asPolygon()

  return BUFFER.difference(CUTOUT).union(ARROW).asBoundary()
}

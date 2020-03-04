import { GEOS, InverseRadians, radians, projectPoint, HALF_PI } from './geos-utils'

export default (wkt, width) => {
  const geometry = GEOS.readWKT(wkt)
  const P_A = geometry.getPointN(-2) // point before last
  const P_B = geometry.getPointN(-1) // last point
  const { azimuth: ALPHA } = InverseRadians(P_A, P_B)
  const P_A1 = projectPoint(P_A, width / 2, ALPHA - HALF_PI)
  const P_A2 = projectPoint(P_A, width / 2, ALPHA + HALF_PI)
  const P_A3 = projectPoint(P_A1, width / 3, ALPHA - radians(135))
  const P_A4 = projectPoint(P_A2, width / 3, ALPHA + radians(135))
  const P_B1 = projectPoint(P_B, width / 4, ALPHA - radians(140))
  const P_B2 = projectPoint(P_B, width / 4, ALPHA + radians(140))

  return GEOS.createCollection([
    geometry,
    GEOS.createLineString([P_A3, P_A1, P_A2, P_A4]),
    GEOS.createLineString([P_B1, P_B, P_B2])
  ])
}

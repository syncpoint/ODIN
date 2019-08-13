import L from 'leaflet'

// retrofit leaflet LatLng with geodesy magic.

const π = Math.PI
const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

/* eslint-disable no-extend-native */
Number.prototype.toRadians = function () { return this * DEG2RAD }
Number.prototype.toDegrees = function () { return this * RAD2DEG }
/* eslint-enable no-extend-native */

export const wrap360 = degrees => {
  if (degrees >= 0 && degrees < 360) return degrees
  return (degrees % 360 + 360) % 360 // sawtooth wave p:360, a:360
}

L.LatLng.midpoint = ([a, b]) => L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2)


// Don't overwrite distanceTo()
// https://leafletjs.com/reference-1.5.0.html#latlng-distanceto
L.LatLng.prototype.distance = function (point, radius = 6371e3) {

  // a = sin²(Δφ/2) + cos(φ1)⋅cos(φ2)⋅sin²(Δλ/2)
  // δ = 2·atan2(√(a), √(1−a))
  // see mathforum.org/library/drmath/view/51879.html for derivation

  const R = radius
  const φ1 = this.lat.toRadians()
  const λ1 = this.lng.toRadians()
  const φ2 = point.lat.toRadians()
  const λ2 = point.lng.toRadians()
  const Δφ = φ2 - φ1
  const Δλ = λ2 - λ1

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c

  return d
}

L.LatLng.prototype.destinationPoint = function (distance, bearing, radius = 6371e3) {

  // sinφ2 = sinφ1⋅cosδ + cosφ1⋅sinδ⋅cosθ
  // tanΔλ = sinθ⋅sinδ⋅cosφ1 / cosδ−sinφ1⋅sinφ2
  // see mathforum.org/library/drmath/view/52049.html for derivation

  const δ = distance / radius // angular distance in radians
  const θ = Number(bearing).toRadians()

  const φ1 = this.lat.toRadians()
  const λ1 = this.lng.toRadians()

  const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  const φ2 = Math.asin(sinφ2)
  const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1)
  const x = Math.cos(δ) - Math.sin(φ1) * sinφ2
  const λ2 = λ1 + Math.atan2(y, x)

  const lat = φ2.toDegrees()
  const lng = λ2.toDegrees()

  return new L.LatLng(lat, lng)
}

L.LatLng.prototype.initialBearingTo = function (point) {
  if (this.equals(point)) return NaN // coincident points

  // tanθ = sinΔλ⋅cosφ2 / cosφ1⋅sinφ2 − sinφ1⋅cosφ2⋅cosΔλ
  // see mathforum.org/library/drmath/view/55417.html for derivation

  const φ1 = this.lat.toRadians()
  const φ2 = point.lat.toRadians()
  const Δλ = (point.lng - this.lng).toRadians()

  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const θ = Math.atan2(y, x)

  const bearing = θ.toDegrees()

  return wrap360(bearing)
}

L.LatLng.prototype.finalBearingTo = function (point) {
  // get initial bearing from destination point to this point & reverse it by adding 180°
  const bearing = point.initialBearingTo(this) + 180
  return wrap360(bearing)
}

L.LatLng.intersection = (p1, brng1, p2, brng2) => {

  // see www.edwilliams.org/avform.htm#Intersection

  const φ1 = p1.lat.toRadians()
  const λ1 = p1.lng.toRadians()
  const φ2 = p2.lat.toRadians()
  const λ2 = p2.lng.toRadians()
  const θ13 = Number(brng1).toRadians()
  const θ23 = Number(brng2).toRadians()
  const Δφ = φ2 - φ1
  const Δλ = λ2 - λ1

  // angular distance p1-p2
  const δ12 =
    2 * Math.asin(Math.sqrt(Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)))

  if (Math.abs(δ12) < Number.EPSILON) return L.latLng(p1.lat, p1.lng) // coincident points

  // initial/final bearings between points
  const cosθa = (Math.sin(φ2) - Math.sin(φ1) * Math.cos(δ12)) / (Math.sin(δ12) * Math.cos(φ1))
  const cosθb = (Math.sin(φ1) - Math.sin(φ2) * Math.cos(δ12)) / (Math.sin(δ12) * Math.cos(φ2))
  const θa = Math.acos(Math.min(Math.max(cosθa, -1), 1)) // protect against rounding errors
  const θb = Math.acos(Math.min(Math.max(cosθb, -1), 1)) // protect against rounding errors

  const θ12 = Math.sin(λ2 - λ1) > 0 ? θa : 2 * π - θa
  const θ21 = Math.sin(λ2 - λ1) > 0 ? 2 * π - θb : θb

  const α1 = θ13 - θ12 // angle 2-1-3
  const α2 = θ21 - θ23 // angle 1-2-3

  if (Math.sin(α1) === 0 && Math.sin(α2) === 0) return null // infinite intersections
  if (Math.sin(α1) * Math.sin(α2) < 0) return null // ambiguous intersection (antipodal?)

  const cosα3 = -Math.cos(α1) * Math.cos(α2) + Math.sin(α1) * Math.sin(α2) * Math.cos(δ12)
  const δ13 = Math.atan2(Math.sin(δ12) * Math.sin(α1) * Math.sin(α2), Math.cos(α2) + Math.cos(α1) * cosα3)
  const φ3 = Math.asin(Math.sin(φ1) * Math.cos(δ13) + Math.cos(φ1) * Math.sin(δ13) * Math.cos(θ13))
  const Δλ13 = Math.atan2(Math.sin(θ13) * Math.sin(δ13) * Math.cos(φ1), Math.cos(δ13) - Math.sin(φ1) * Math.sin(φ3))
  const λ3 = λ1 + Δλ13

  const lat = φ3.toDegrees()
  const lng = λ3.toDegrees()

  return L.latLng(lat, lng)
}

L.LatLng.line = ([a, b]) => {
  const initialBearing = a.initialBearingTo(b)
  const finalBearing = a.finalBearingTo(b)

  return {
    points: [a, b],
    initialBearing,
    finalBearing,
    translate: (distance, bearing) => L.LatLng.line([
      a.destinationPoint(distance, initialBearing + bearing),
      b.destinationPoint(distance, finalBearing + bearing)
    ]),
    intersection: line => L.LatLng.intersection(
      a, initialBearing,
      line.points[1], line.finalBearing + 180
    ),
    midpoint: () => {
      const distance = a.distance(b)
      return a.destinationPoint(distance / 2, initialBearing)
    }
  }
}

L.Point.centroid = points => {
  const len = points.length
  if (!len) return null

  let area = 0
  let x = 0
  let y = 0

  for (let i = 0, j = len - 1; i < len; j = i++) {
    const f = points[i].y * points[j].x - points[j].y * points[i].x
    x += (points[i].x + points[j].x) * f
    y += (points[i].y + points[j].y) * f
    area += f * 3
  }

  if (area === 0) return points[0]
  else return L.point(x / area, y / area)
}

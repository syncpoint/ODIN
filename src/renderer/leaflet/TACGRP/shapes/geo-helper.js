import L from 'leaflet'
import * as math from 'mathjs'

// Line: [v1, v2]
export const projectedPoint = (v1, v2, p) => {
  const e1 = [v2.x - v1.x, v2.y - v1.y]
  const e2 = [p.x - v1.x, p.y - v1.y]
  const dp = math.dot(e1, e2)
  const d = e1[0] * e1[0] + e1[1] * e1[1]
  return L.point(v1.x + (dp * e1[0]) / d, v1.y + (dp * e1[1]) / d)
}

export const line = points => {
  const sq = x => x * x
  const dx = points[0].x - points[1].x
  const dy = points[0].y - points[1].y
  const d = Math.sqrt(sq(dx) + sq(dy))

  const point = f => L.point(
    points[0].x + f * (points[1].x - points[0].x),
    points[0].y + f * (points[1].y - points[0].y)
  )

  // EAST: 0°, SOUTH: 90°, WEST: 180°, NORTH: 270°
  const angle = () => {
    var theta = Math.atan2(dy, dx) // range (-PI, PI]
    theta *= 180 / Math.PI // rads to degs, range (-180, 180]
    if (theta < 0) theta = 360 + theta // range [0, 360)
    return theta
  }

  return { d, point, angle, points }
}

export const calcStruts = (center, envelope) => fs => fs.map(f => {
  const dw = line(envelope[0]).d
  const s0 = line(center.slice(0, 2))
  const C = s0.point(f * (dw / s0.d))
  return line([
    projectedPoint(envelope[0][0], envelope[1][0], C),
    projectedPoint(envelope[0][1], envelope[1][1], C)
  ])
})

export const calcStruts2 = (center, envelope) => fs => fs.map(f => {
  const s0 = line(center.slice(0, 2))
  const C = s0.point(f)
  return line([
    projectedPoint(envelope[0][0], envelope[1][0], C),
    projectedPoint(envelope[0][1], envelope[1][1], C)
  ])
})

export const arc = (c, r) => xs => xs.map(x => L.point(r * Math.cos(x) + c.x, r * Math.sin(x) + c.y))

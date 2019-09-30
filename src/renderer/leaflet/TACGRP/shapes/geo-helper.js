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
  const d = Math.sqrt(
    sq(points[0].x - points[1].x) +
    sq(points[0].y - points[1].y)
  )

  const point = f => L.point(
    points[0].x + f * (points[1].x - points[0].x),
    points[0].y + f * (points[1].y - points[0].y)
  )

  return {
    d,
    point
  }
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

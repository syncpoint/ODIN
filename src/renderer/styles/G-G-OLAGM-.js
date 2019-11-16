import * as R from 'ramda'
import * as math from 'mathjs'
import tacgrp from './tacgrp'
import { MultiLineString } from './predef'

const Point = {}
Point.translate = v => point => math.add(point, v)
Point.project = p => line => {
  const e1 = [line[1][0] - line[0][0], line[1][1] - line[0][1]]
  const e2 = [p[0] - line[0][0], p[1] - line[0][1]]
  const dp = math.dot(e1, e2)
  const d = e1[0] * e1[0] + e1[1] * e1[1]
  return [line[0][0] + (dp * e1[0]) / d, line[0][1] + (dp * e1[1]) / d]
}

const Line = {}
Line.intersect = xs => math.intersect(xs[0][0], xs[0][1], xs[1][0], xs[1][1])
Line.length = line => Math.hypot(line[0][0] - line[1][0], line[0][1] - line[1][1])
Line.orthv = line => [-(line[1][1] - line[0][1]), line[1][0] - line[0][0]]
Line.normv = (orthv, d = 1) => math.multiply(orthv, d / Math.hypot(orthv[0], orthv[1]))
Line.translate = d => line => line.map(Point.translate(Line.normv(Line.orthv(line), d)))
Line.point = line => f => [
  line[0][0] + f * (line[1][0] - line[0][0]),
  line[0][1] + f * (line[1][1] - line[0][1])
]

// MAIN ATTACK (AXIS OF ADVANCE): TACGRP.C2GM.OFF.LNE.AXSADV.GRD.MANATK
const geometry = feature => {
  const { length, point, translate, intersect } = Line
  const { project } = Point

  /* eslint-disable camelcase */
  const { geometry_width } = feature.getProperties()
  const width = geometry_width / 2
  const points = feature.getGeometry().getCoordinates().reverse()
  const segments = R.aperture(2, points)
  const left = segments.map(translate(-width))
  const right = segments.map(translate(width))

  const struts = (width, s0) => fs => fs.map(f => {
    const projectC = project(point(s0)(f * width / length(s0)))
    return [projectC([...left[0]]), projectC([...right[0]])]
  })

  /* eslint-disable */

  const s = struts(geometry_width, points.slice(0, 2))([ 0.76, 0.38 ])
  return MultiLineString.of([
    [
      left[left.length - 1][1], ...R.aperture(2, left).map(intersect).reverse(),
      point(s[0])(0), point(s[0])(-0.5),
      points[0],
      point(s[0])(1.5), point(s[0])(1),
      ...R.aperture(2, right).map(intersect), right[right.length - 1][1]
    ],
    [
      point(s[0])(1), point(s[1])(0.5), point(s[0])(0)
    ]
  ])
}

tacgrp['G-G-OLAGM-'] = { geometry }

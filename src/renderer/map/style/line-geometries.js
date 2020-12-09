import * as R from 'ramda'
import * as style from 'ol/style'
import * as TS from '../ts'
import echelons from './echelons'

const linearTarget = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0.1], [0, -0.1], [1, 0.1], [1, -0.1]
  ])

  return styles.solidLine(TS.collect([
    line,
    TS.lineString(R.props([0, 1], xs)),
    TS.lineString(R.props([2, 3], xs))
  ]))
}

export const geometries = {

  /**
   * TACGRP.FSUPP.LNE.LNRTGT
   * LINEAR TARGET
   */
  'G*F*LT----': linearTarget,

  /**
   * TACGRP.FSUPP.LNE.LNRTGT.LSTGT
   * LINEAR SMOKE TARGET
   */
  'G*F*LTS---': linearTarget,

  /**
   * TACGRP.FSUPP.LNE.LNRTGT.FPF
   * FINAL PROTECTIVE FIRE (FPF)
   */
  'G*F*LTF---': linearTarget
}

/**
 * DIRECTION OF ATTACK / AVIATION
 * TACGRP.C2GM.OFF.LNE.DIRATK.AVN
 */
geometries['G*G*OLKA--'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.25, 0], [0.4, 0], [0.25, -0.04], [0.4, 0.04], [0.4, -0.04], [0.25, 0.04],
    [0.95, -0.05], [1, 0], [0.95, 0.05]
  ])

  return styles.solidLine(TS.collect([
    TS.lineString([coords[0], xs[0]]),
    TS.lineString([xs[1], coords[1]]),
    TS.polygon(R.props([2, 3, 4, 5, 2], xs)),
    TS.lineString(R.props([6, 7, 8], xs))
  ]))
}

/**
 * TACGRP.C2GM.OFF.LNE.DIRATK.GRD.MANATK
 * DIRECTION OF ATTACK / MAIN ATTACK
 */
geometries['G*G*OLKGM-'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.86, -0.1], [1, 0], [0.86, 0.1], [0.86, 0.07], [0.965, 0], [0.86, -0.07]
  ])

  return styles.solidLine(TS.collect([
    TS.lineString([coords[0], xs[4]]),
    TS.polygon(R.props([0, 1, 2, 3, 4, 5, 0], xs))
  ]))
}

/**
 * TACGRP.C2GM.OFF.LNE.DIRATK.GRD.SUPATK
 * DIRECTION OF ATTACK / SUPPORTING ATTACK
 */
geometries['G*G*OLKGS-'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.86, -0.1], [1, 0], [0.86, 0.1]
  ])

  return styles.solidLine(TS.collect([
    line,
    TS.lineString(R.props([0, 1, 2], xs))
  ]))
}

/**
 * TACGRP.C2GM.DCPN.DAFF
 * DIRECTION OF ATTACK FOR FEINT
 */
geometries['G*G*PF----'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.8, 0.2], [1, 0], [0.8, -0.2],
    [0.8, -0.136], [0.94, 0], [0.8, 0.136]
  ])

  return [
    styles.solidLine(TS.collect([
      TS.lineString([coords[0], xs[4]]),
      TS.lineString(R.props([3, 4, 5], xs))
    ])),
    styles.dashedLine(TS.lineString(R.props([0, 1, 2], xs)), { lineDash: [8, 8] })
  ]
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.FRY
 * CROSSING SITE / FERRY
 */
geometries['G*M*BCF---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const length = segment.getLength()
  const angle = segment.angle()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0], [0.08, -0.06], [0.08, 0], [0.08, 0.06],
    [1, 0], [0.92, -0.06], [0.92, 0], [0.92, 0.06]
  ])

  return [
    styles.solidLine(TS.lineString([xs[2], xs[6]])),
    styles.filledPolygon(TS.polygon(R.props([0, 1, 2, 3, 0], xs))),
    styles.filledPolygon(TS.polygon(R.props([4, 5, 6, 7, 4], xs)))
  ]
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.LANE
 * CROSSING SITE / LANE
 */
geometries['G*M*BCL---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [-0.09, -0.08], [0, 0], [-0.09, 0.08],
    [1.09, -0.08], [1, 0], [1.09, 0.08]
  ])

  return styles.solidLine(TS.collect([
    line,
    TS.lineString(R.props([0, 1, 2], xs)),
    TS.lineString(R.props([3, 4, 5], xs))
  ]))
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.RFT
 * CROSSING SITE / RAFT
 */
geometries['G*M*BCR---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [-0.09, -0.2], [0, 0], [-0.09, 0.2],
    [1.09, -0.2], [1, 0], [1.09, 0.2]
  ])

  return styles.solidLine(TS.collect([
    line,
    TS.lineString(R.props([0, 1, 2], xs)),
    TS.lineString(R.props([3, 4, 5], xs))
  ]))
}

/**
 * TACGRP.MOBSU.OBST.OBSEFT.FIX
 * OBSTACLE EFFECT / FIX
 */
geometries['G*M*OEF---'] = ({ line, styles, resolution }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [1, 0], [0.9, -0.04], [0.9, 0], [0.9, 0.04], [1, 0]
  ])

  const [p0, p1] = [segment.pointAlong(0.2), segment.pointAlong(0.8)]
  const [p00, p01, p10, p11] = [
    ...TS.projectCoordinates(resolution * 8, angle, p0)([[0, -1], [0, 1]]),
    ...TS.projectCoordinates(resolution * 8, angle, p1)([[0, -1], [0, 1]])
  ]

  const n = Math.floor(length / (resolution * 10))
  const x = R.flatten(R.zip(
    TS.segmentize(TS.segment(p00, p10), n).filter((_, i) => i % 2 === 0),
    TS.segmentize(TS.segment(p01, p11), n).filter((_, i) => i % 2 !== 0)
  ))

  return [
    styles.solidLine(TS.collect([
      TS.lineString([coords[0], p0]),
      TS.lineString([p0, ...x, p1]),
      TS.lineString([p1, xs[2]])
    ])),
    styles.filledPolygon(TS.polygon(xs))
  ]
}

/**
 * TACGRP.TSK.FIX
 * TASKS / FIX
 */
geometries['G*T*F-----'] = ({ line, styles, resolution }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.95, -0.04], [1, 0], [0.95, 0.04]
  ])

  const [p0, p1] = [segment.pointAlong(0.2), segment.pointAlong(0.8)]
  const [p00, p01, p10, p11] = [
    ...TS.projectCoordinates(resolution * 8, angle, p0)([[0, -1], [0, 1]]),
    ...TS.projectCoordinates(resolution * 8, angle, p1)([[0, -1], [0, 1]])
  ]

  const n = Math.floor(length / (resolution * 10))
  const x = R.flatten(R.zip(
    TS.segmentize(TS.segment(p00, p10), n).filter((_, i) => i % 2 === 0),
    TS.segmentize(TS.segment(p01, p11), n).filter((_, i) => i % 2 !== 0)
  ))

  return styles.solidLine(TS.collect([
    TS.lineString([coords[0], p0]),
    TS.lineString([p0, ...x, p1]),
    TS.lineString([p1, coords[1]]),
    TS.lineString(xs)
  ]))
}
/**
 * TACGRP.MOBSU.SU.FEWS
 * FOXHOLE, EMPLACEMENT OR WEAPON SITE
 */
geometries['G*M*SW----'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0.18], [0, 0], [1, 0], [1, 0.18]
  ])

  return styles.solidLine(TS.lineString(R.props([0, 1, 2, 3], xs)))
}

/**
 * TACGRP.OTH.HAZ.NVGL
 * HAZARD / NAVIGATIONAL
 */
geometries['G*O*HN----'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.18, -0.2], [0, 0], [1, 0], [0.82, 0.2]
  ])

  return styles.solidLine(TS.lineString(R.props([0, 1, 2, 3], xs)))
}

/**
 * TACGRP.TSK.FLWASS
 * TASKS / FOLLOW AND ASSUME
 */
geometries['G*T*A-----'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0.08], [0, -0.08], [0.32, -0.08], [0.4, 0], [0.32, 0.08],
    [0.8, 0.2], [1, 0], [0.8, -0.2], [0.8, -0.16], [0.96, 0], [0.8, 0.16],
    [0, 0.2]
  ])

  return styles.solidLine(TS.collect([
    TS.lineString(R.props([3, 9], xs)),
    TS.polygon(R.props([0, 1, 2, 3, 4, 0], xs)),
    TS.polygon(R.props([5, 6, 7, 8, 9, 10, 5], xs))
  ]))
}

/**
 * TACGRP.TSK.FLWASS.FLWSUP
 * TASKS / FOLLOW AND SUPPORT
 */
geometries['G*T*AS----'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
    [0, 0], [-0.08, -0.08], [0.32, -0.08], [0.4, 0], [0.32, 0.08], [-0.08, 0.08],
    [0.82, -0.08], [1, 0], [0.82, 0.08], [0.82, 0]
  ])

  return [
    styles.solidLine(TS.collect([
      TS.lineString(R.props([3, 9], xs)),
      TS.polygon(R.props([0, 1, 2, 3, 4, 5, 0], xs))
    ])),
    styles.filledPolygon(TS.polygon(R.props([6, 7, 8, 6], xs)))
  ]
}

/**
 * TACGRP.CSS.LNE.CNY.HCNY
 * HALTED CONVOY
 */
geometries['G*S*LCH---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
    [0, -0.1], [1, -0.1], [1, 0.1], [0, 0.1],
    [1, 0], [1.16, -0.15], [1.16, 0.15]
  ])

  return styles.solidLine(TS.collect([
    TS.polygon(R.props([0, 1, 2, 3, 0], xs)),
    TS.polygon(R.props([4, 5, 6, 4], xs))
  ]))
}

/**
 * TACGRP.CSS.LNE.CNY.MCNY
 * MOVING CONVOY
 */
geometries['G*S*LCM---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
    [0, -0.1], [0.8, -0.1], [0.8, -0.16], [1, 0], [0.8, 0.16], [0.8, 0.1], [0, 0.1]
  ])

  return styles.solidLine(TS.lineString(R.props([0, 1, 2, 3, 4, 5, 6, 0], xs)))
}

const numberProperty = feature => (key, value) => {
  const raw = feature.get(key)
  return typeof raw === 'number'
    ? raw
    : value
}

geometries['G*G*GLB---'] = options => {
  const { feature, resolution, styles, line: geometry, write } = options
  const echelonOffset = numberProperty(feature)('echelonOffset', 0.5)
  const modifier = feature.get('sidc')[11]
  const src = 'data:image/svg+xml;utf8,' + echelons[modifier]
  const image = new style.Icon({ src, scale: 0.4 })
  const size = image.getSize()
  const width = size && size[0] && size[0] * resolution / 2

  const line = TS.lengthIndexedLine(geometry)
  const A = line.getStartIndex()
  const D = line.getEndIndex()
  const offset = (D - A) * echelonOffset
  const B = offset - width / 2
  const C = offset + width / 2

  const icon = () => {
    if (width > D - A) return [] // don't show icon
    const segment = TS.segment(
      line.extractPoint(offset - resolution),
      line.extractPoint(offset + resolution)
    )

    const iconAnchor = TS.point(segment.pointAlong(0.5))
    image.setRotation(2 * Math.PI - segment.angle())
    return new style.Style({ image, geometry: write(iconAnchor) })
  }

  return [
    icon(),
    styles.solidLine(TS.union([
      line.extractLine(A, B),
      line.extractLine(C, D)
    ]))
  ]
}

/**
 * TACGRP.C2GM.GNL.LNE.LOC
 * LINE OF CONTACT
 */
geometries['G*G*GLC---'] = options => {
  const { resolution, styles, line: geometry } = options
  const line = TS.lengthIndexedLine(geometry)
  const length = line.getEndIndex()
  const width = resolution * 20
  const n = Math.floor(length / width)
  const offset = (length - n * width) / 2

  /* eslint-disable */
  const point = index => line.extractPoint(index)
  const segmentsA = R.range(0, n)
    .map(i => [point(offset + i * width), point(offset + (i + 1) * width)])
    .map(TS.segment)
    .map(s => [s.pointAlong(0.5), s.angle()])
    .map(([C, α]) => [TS.projectCoordinate(C)([α + Math.PI / 2, width / 2]), α])
    .map(([C, α]) => TS.arc(C, width / 2, α, Math.PI, 16))
    .map(coords => TS.lineString(coords))

  const segmentsB = R.range(0, n)
    .map(i => [point(offset + i * width), point(offset + (i + 1) * width)])
    .map(TS.segment)
    .map(s => [s.pointAlong(0.5), s.angle()])
    .map(([C, α]) => [TS.projectCoordinate(C)([α - Math.PI / 2, width / 2]), α])
    .map(([C, α]) => TS.arc(C, width / 2, α + Math.PI, Math.PI, 16))
    .map(coords => TS.lineString(coords))

  return [
    styles.solidLine(TS.collect(segmentsA)),
    styles.solidLine(TS.collect(segmentsB))
  ]
}

/**
 * TACGRP.C2GM.GNL.LNE.FLOT
 * FORWARD LINE OF OWN TROOPS (FLOT)
 */
geometries['G*G*GLF---'] = options => {
  const { resolution, styles, line: geometry } = options
  const line = TS.lengthIndexedLine(geometry)
  const length = line.getEndIndex()
  const width = resolution * 20
  const n = Math.floor(length / width)
  const offset = (length - n * width) / 2

  const point = index => line.extractPoint(index)
  const segments = R.range(0, n)
    .map(i => [point(offset + i * width), point(offset + (i + 1) * width)])
    .map(TS.segment)
    .map(s => [s.pointAlong(0.5), s.angle()])
    .map(([C, α]) => [TS.projectCoordinate(C)([α + Math.PI / 2, width / 2]), α])
    .map(([C, α]) => TS.arc(C, width / 2, α, Math.PI, 16))
    .map(coords => TS.lineString(coords))

  return [
    styles.solidLine(TS.collect(segments))
  ]
}

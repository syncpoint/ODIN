import * as R from 'ramda'
import * as style from 'ol/style'
import * as TS from '../ts'
import { K } from '../../../shared/combinators'
import * as G from './geodesy'
import echelons from './echelons'
import {
  simpleArrowEnd,
  simpleArrowStart,
  doubleArrow
} from './arrows'

const linearTarget = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const width = resolution * 10
  const [PA1, PA2] = G.translateLine(width, +90)(line)
  const [PB1, PB2] = G.translateLine(width, -90)(line)
  return styles.multiLineString([line, [PA1, PB1], [PA2, PB2]])
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
geometries['G*G*OLKA--'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const initialBearing = G.initialBearing(line)
  const length = G.distance(line)
  const PA = line[0].destinationPoint(length / 4, initialBearing)
  const PB = line[0].destinationPoint(length / 4 + resolution * 20, initialBearing)
  const PA1 = PA.destinationPoint(resolution * 5, initialBearing + 90)
  const PA2 = PA.destinationPoint(resolution * 5, initialBearing - 90)
  const PB1 = PB.destinationPoint(resolution * 5, initialBearing + 90)
  const PB2 = PB.destinationPoint(resolution * 5, initialBearing - 90)
  return styles.multiLineString([
    [line[0], PA], [PB, line[1]],
    simpleArrowEnd(line, resolution),
    [PA1, PA2, PB1, PB2, PA1]
  ])
}

/**
 * TACGRP.C2GM.OFF.LNE.DIRATK.GRD.MANATK
 * DIRECTION OF ATTACK / MAIN ATTACK
 */
geometries['G*G*OLKGM-'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const lastSegment = R.last(R.aperture(2, line))
  const arrow = doubleArrow(lastSegment, resolution)
  return styles.multiLineString([
    R.init(line),
    [lastSegment[0], arrow[4]],
    arrow
  ])
}

/**
 * TACGRP.C2GM.OFF.LNE.DIRATK.GRD.SUPATK
 * DIRECTION OF ATTACK / SUPPORTING ATTACK
 */
geometries['G*G*OLKGS-'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const lastSegment = R.last(R.aperture(2, line))
  return styles.multiLineString([
    line,
    simpleArrowEnd(lastSegment, resolution)
  ])
}

/**
 * TACGRP.C2GM.DCPN.DAFF
 * DIRECTION OF ATTACK FOR FEINT
 */
geometries['G*G*PF----'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const finalBearing = G.finalBearing(line)
  const PB = line[1].destinationPoint(resolution * -8, finalBearing)

  return [
    styles.multiLineString([[line[0], PB], simpleArrowEnd([line[0], PB], resolution, 20, 130)]),
    styles.multiLineString([simpleArrowEnd(line, resolution, 20, 130)]).map(s => K(s)(s => s.getStroke().setLineDash([10, 7])))
  ].flat()
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.FRY
 * CROSSING SITE / FERRY
 */
geometries['G*M*BCF---'] = options => {
  const { styles, line } = options
  const [segment] = TS.segments(line)
  const angle = 2 * Math.PI - segment.angle()

  return [
    styles.solidLine(line),
    styles.closedArrow(TS.startPoint(line), { rotation: angle - Math.PI / 2 }),
    styles.closedArrow(TS.endPoint(line), { rotation: angle + Math.PI / 2 })
  ]
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.LANE
 * CROSSING SITE / LANE
 */
geometries['G*M*BCL---'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const arrowEnd = simpleArrowEnd(line, resolution, 15, -35)
  const arrowStart = simpleArrowStart(line, resolution, 15, -35)
  return styles.multiLineString([line, arrowEnd, arrowStart])
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.RFT
 * CROSSING SITE / RAFT
 */
geometries['G*M*BCR---'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const arrowEnd = simpleArrowEnd(line, resolution, 25, -60)
  const arrowStart = simpleArrowStart(line, resolution, 25, -60)
  return styles.multiLineString([line, arrowEnd, arrowStart])
}

const fixLike = arrowFn => options => {
  const { line, styles, resolution } = options
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const [p0, p1] = [segment.pointAlong(0.2), segment.pointAlong(0.8)]
  const [p00, p01, p10, p11] = [
    ...TS.projectCoordinates(resolution * 8, angle, p0)([[0, -1], [0, 1]]),
    ...TS.projectCoordinates(resolution * 8, angle, p1)([[0, -1], [0, 1]])
  ]

  const n = Math.floor(segment.getLength() / (resolution * 10))
  const x = R.flatten(R.zip(
    TS.segmentize(TS.segment(p00, p10), n).filter((_, i) => i % 2 === 0),
    TS.segmentize(TS.segment(p01, p11), n).filter((_, i) => i % 2 !== 0)
  ))

  return [
    styles.solidLine(TS.collect([
      TS.lineString([coords[0], p0]),
      TS.lineString([p0, ...x, p1]),
      TS.lineString([coords[1], p1])
    ])),
    arrowFn(TS.endPoint(line), { rotation: 2 * Math.PI - angle + Math.PI / 2 })
  ]
}

/**
 * TACGRP.MOBSU.OBST.OBSEFT.FIX
 * OBSTACLE EFFECT / FIX
 */
geometries['G*M*OEF---'] = options => fixLike(options.styles.closedArrow)(options)

/**
 * TACGRP.TSK.FIX
 * TASKS / FIX
 */
geometries['G*T*F-----'] = options => fixLike(options.styles.openArrow)(options)

/**
 * TACGRP.MOBSU.SU.FEWS
 * FOXHOLE, EMPLACEMENT OR WEAPON SITE
 */
geometries['G*M*SW----'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const width = resolution * 20
  const [PA1, PA2] = G.translateLine(width, +90)(line)
  return styles.multiLineString([[PA1, ...line, PA2]])
}

/**
 * TACGRP.OTH.HAZ.NVGL
 * HAZARD / NAVIGATIONAL
 */
geometries['G*O*HN----'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const [initialBearing, finalBearing] = G.bearings(line)
  const width = resolution * 25
  const PA = line[1].destinationPoint(width, finalBearing + 120)
  const PB = line[0].destinationPoint(width, initialBearing - 60)
  return styles.multiLineString([[PB, ...line, PA]])
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

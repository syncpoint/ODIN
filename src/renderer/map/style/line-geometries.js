import * as R from 'ramda'
import * as TS from '../ts'
import { K } from '../../../shared/combinators'
import * as G from './geodesy'
import {
  simpleArrowEnd,
  simpleArrowStart,
  closedArrowEnd,
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
geometries['G*T*A-----'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const initialBearing = G.initialBearing(line)
  const length = G.distance(line)
  const arrow = doubleArrow(line, resolution, 40, 140)
  const width = resolution * 15
  const PB1 = line[0].destinationPoint(width, initialBearing + 90)
  const PB2 = PB1.destinationPoint(length / 3, initialBearing)
  const PB5 = line[0].destinationPoint(width, initialBearing - 90)
  const PB4 = PB5.destinationPoint(length / 3, initialBearing)
  const PB3 = line[0].destinationPoint(width + length / 3, initialBearing)
  return [
    styles.multiLineString([[PB3, arrow[4]]]).map(s => K(s)(s => s.getStroke().setLineDash([10, 7]))),
    styles.multiLineString([arrow, [PB1, PB2, PB3, PB4, PB5, PB1]])
  ].flat()
}

/**
 * TACGRP.TSK.FLWASS.FLWSUP
 * TASKS / FOLLOW AND SUPPORT
 */
geometries['G*T*AS----'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const initialBearing = G.initialBearing(line)
  const length = G.distance(line)
  const arrow = closedArrowEnd(line, resolution, 30, 160)
  const width = resolution * 15
  const PB0 = line[0].destinationPoint(width, initialBearing)
  const PB1 = line[0].destinationPoint(width, initialBearing + 90)
  const PB2 = PB1.destinationPoint(length / 3, initialBearing)
  const PB5 = line[0].destinationPoint(width, initialBearing - 90)
  const PB4 = PB5.destinationPoint(length / 3, initialBearing)
  const PB3 = line[0].destinationPoint(width + length / 3, initialBearing)

  return styles.multiLineString([
    [PB3, arrow[3]],
    arrow,
    [PB1, PB2, PB3, PB4, PB5, PB0, PB1]
  ])
}

/**
 * TACGRP.CSS.LNE.CNY.HCNY
 * HALTED CONVOY
 */
geometries['G*S*LCH---'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const finalBearing = G.finalBearing(line)
  const width = resolution * 25
  const PB1 = line[1].destinationPoint(-width, finalBearing)
  const PB2 = line[1].destinationPoint(width, finalBearing + 90)
  const PB3 = line[1].destinationPoint(width, finalBearing - 90)
  const [PA1, PA2] = G.translateLine(width / 1.5, +90)([line[0], PB1])
  const [PA4, PA3] = G.translateLine(width / 1.5, -90)([line[0], PB1])
  return styles.multiLineString([
    [PA1, PA2, PA3, PA4, PA1],
    [PB1, PB2, PB3, PB1]
  ])
}

/**
 * TACGRP.CSS.LNE.CNY.MCNY
 * MOVING CONVOY
 */
geometries['G*S*LCM---'] = ({ feature, resolution, styles }) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const finalBearing = G.finalBearing(line)
  const width = resolution * 25
  const PB1 = line[1].destinationPoint(-width, finalBearing)
  const PB2 = PB1.destinationPoint(width, finalBearing + 90)
  const PB3 = PB1.destinationPoint(width, finalBearing - 90)
  const [PA1, PA2] = G.translateLine(width / 1.5, +90)([line[0], PB1])
  const [PA4, PA3] = G.translateLine(width / 1.5, -90)([line[0], PB1])
  return styles.multiLineString([[PA3, PA4, PA1, PA2, PB2, line[1], PB3, PA3]])
}

import * as R from 'ramda'
import { K } from '../../../shared/combinators'
import * as G from './geodesy'
import { lineStyle } from './default-style'
import {
  simpleArrowEnd,
  simpleArrowStart,
  closedArrowEnd,
  closedArrowStart,
  doubleArrow
} from './arrows'


const zigzag = (line, resolution) => {
  const [initialBearing, finalBearing] = G.bearings(line)
  const bearing = (initialBearing + finalBearing) / 2
  const width = resolution * 10
  const steps = G.distance(line) / width
  const [PA1] = G.translateLine(resolution * 10, +90)(line)
  const [PB1] = G.translateLine(resolution * 10, -90)(line)
  return R.range(0, steps).reduce((acc, i) => K(acc)(acc => {
    const point = i % 2 === 0 ? PA1 : PB1
    acc.push(point.destinationPoint((i + 0.25) * width, bearing))
  }), [])
}

const linearTarget = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const width = resolution * 10
  const [PA1, PA2] = G.translateLine(width, +90)(line)
  const [PB1, PB2] = G.translateLine(width, -90)(line)
  return lineStyle(feature, [line, [PA1, PB1], [PA2, PB2]])
}

export const geometries = {
  'G*F*LT----': linearTarget,
  'G*F*LTS---': linearTarget,
  'G*F*LTF---': linearTarget
}

geometries['G*G*OLKA--'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const initialBearing = G.initialBearing(line)
  const length = G.distance(line)
  const PA = line[0].destinationPoint(length / 4, initialBearing)
  const PB = line[0].destinationPoint(length / 4 + resolution * 20, initialBearing)
  const PA1 = PA.destinationPoint(resolution * 5, initialBearing + 90)
  const PA2 = PA.destinationPoint(resolution * 5, initialBearing - 90)
  const PB1 = PB.destinationPoint(resolution * 5, initialBearing + 90)
  const PB2 = PB.destinationPoint(resolution * 5, initialBearing - 90)
  return lineStyle(feature, [
    [line[0], PA], [PB, line[1]],
    simpleArrowEnd(line, resolution),
    [PA1, PA2, PB1, PB2, PA1]
  ])
}

geometries['G*G*OLKGM-'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const arrow = doubleArrow(line, resolution)
  return lineStyle(feature, [[line[0], arrow[4]], arrow])
}

geometries['G*G*OLKGS-'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  return lineStyle(feature, [line, simpleArrowEnd(line, resolution)])
}

geometries['G*G*PF----'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const finalBearing = G.finalBearing(line)
  const PB = line[1].destinationPoint(resolution * -8, finalBearing)

  const s1 = lineStyle(feature, [
    [line[0], PB],
    simpleArrowEnd([line[0], PB], resolution, 20, 130)
  ])

  const s2 = lineStyle(feature, [simpleArrowEnd(line, resolution, 20, 130)])
    .map(s => K(s)(s => s.getStroke().setLineDash([10, 7])))

  return s1.concat(s2)
}

geometries['G*M*BCF---'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const arrowEnd = closedArrowEnd(line, resolution)
  const arrowStart = closedArrowStart(line, resolution)
  return lineStyle(feature, [
    [arrowStart[3], arrowEnd[3]],
    arrowEnd,
    arrowStart
  ])
}

geometries['G*M*BCL---'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const arrowEnd = simpleArrowEnd(line, resolution, 15, -35)
  const arrowStart = simpleArrowStart(line, resolution, 15, -35)
  return lineStyle(feature, [
    line,
    arrowEnd,
    arrowStart
  ])
}

geometries['G*M*BCR---'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const arrowEnd = simpleArrowEnd(line, resolution, 25, -60)
  const arrowStart = simpleArrowStart(line, resolution, 25, -60)
  return lineStyle(feature, [
    line,
    arrowEnd,
    arrowStart
  ])
}

geometries['G*M*OEF---'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const [initialBearing, finalBearing] = G.bearings(line)
  const length = G.distance(line)
  const PA = line[0].destinationPoint(length * 0.2, initialBearing)
  const PB = line[1].destinationPoint(length * 0.2, finalBearing - 180)
  const arrow = closedArrowEnd(line, resolution)
  return lineStyle(feature, [
    [line[0], PA, ...zigzag([PA, PB], resolution), PB, arrow[3]],
    arrow
  ])
}

geometries['G*M*SW----'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const width = resolution * 20
  const [PA1, PA2] = G.translateLine(width, +90)(line)
  return lineStyle(feature, [[PA1, ...line, PA2]])
}

geometries['G*O*HN----'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const [initialBearing, finalBearing] = G.bearings(line)
  const width = resolution * 25
  const PA = line[1].destinationPoint(width, finalBearing + 120)
  const PB = line[0].destinationPoint(width, initialBearing - 60)
  return lineStyle(feature, [[PB, ...line, PA]])
}

geometries['G*T*A-----'] = (feature, resolution) => {
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

  const s1 = lineStyle(feature, [[PB3, arrow[4]]])
    .map(s => K(s)(s => s.getStroke().setLineDash([10, 7])))

  const s2 = lineStyle(feature, [
    arrow,
    [PB1, PB2, PB3, PB4, PB5, PB1]
  ])

  return s1.concat(s2)
}

geometries['G*T*AS----'] = (feature, resolution) => {
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

  return lineStyle(feature, [
    [PB3, arrow[3]],
    arrow,
    [PB1, PB2, PB3, PB4, PB5, PB0, PB1]
  ])
}

geometries['G*S*LCH---'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const finalBearing = G.finalBearing(line)
  const width = resolution * 25
  const PB1 = line[1].destinationPoint(-width, finalBearing)
  const PB2 = line[1].destinationPoint(width, finalBearing + 90)
  const PB3 = line[1].destinationPoint(width, finalBearing - 90)
  const [PA1, PA2] = G.translateLine(width / 1.5, +90)([line[0], PB1])
  const [PA4, PA3] = G.translateLine(width / 1.5, -90)([line[0], PB1])
  return lineStyle(feature, [
    [PA1, PA2, PA3, PA4, PA1],
    [PB1, PB2, PB3, PB1]
  ])
}

geometries['G*S*LCM---'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const finalBearing = G.finalBearing(line)
  const width = resolution * 25
  const PB1 = line[1].destinationPoint(-width, finalBearing)
  const PB2 = PB1.destinationPoint(width, finalBearing + 90)
  const PB3 = PB1.destinationPoint(width, finalBearing - 90)
  const [PA1, PA2] = G.translateLine(width / 1.5, +90)([line[0], PB1])
  const [PA4, PA3] = G.translateLine(width / 1.5, -90)([line[0], PB1])
  return lineStyle(feature, [[PA3, PA4, PA1, PA2, PB2, line[1], PB3, PA3]])
}

geometries['G*T*F-----'] = (feature, resolution) => {
  const line = G.coordinates(feature).map(G.toLatLon)
  const [initialBearing, finalBearing] = G.bearings(line)
  const length = G.distance(line)
  const PA = line[0].destinationPoint(length * 0.2, initialBearing)
  const PB = line[1].destinationPoint(length * 0.2, finalBearing - 180)
  return lineStyle(feature, [
    [line[0], PA, ...zigzag([PA, PB], resolution), PB, line[1]],
    simpleArrowEnd(line, resolution)
  ])
}

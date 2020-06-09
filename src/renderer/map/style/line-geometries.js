import * as geom from 'ol/geom'
import { getTransform } from 'ol/proj'
import * as R from 'ramda'
import LatLon from 'geodesy/latlon-spherical.js'
import { K, T } from '../../../shared/combinators'
import defaultStyle from './default-style'

const toEPSG4326 = getTransform('EPSG:3857', 'EPSG:4326')
const toEPSG3857 = getTransform('EPSG:4326', 'EPSG:3857')
const toLatLon = p => T(toEPSG4326(p))(([lon, lat]) => new LatLon(lat, lon))
const fromLatLon = ({ lat, lon }) => toEPSG3857([lon, lat])

const bearings = ([a, b]) => ([a.initialBearingTo(b), a.finalBearingTo(b)])
const distance = ([a, b]) => a.distanceTo(b)

const destinationPoint =
  (distance, bearing) => ([point, deltaBearing]) =>
    point.destinationPoint(distance, deltaBearing + bearing)

const translateLine =
  (distance, bearing) => line =>
    R.zip(line, bearings(line))
      .map(destinationPoint(distance, bearing))

const coordinates = feature => feature.getGeometry().getCoordinates()

const simpleArrowEnd = (line, resolution, widthFactor = 15, bearing = 145) => {
  const [finalBearing] = bearings(line).reverse()
  const arrowWidth = resolution * widthFactor
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  return [PA, line[1], PB]
}

const simpleArrowStart = (line, resolution, widthFactor = 15, bearing = 145) => {
  const [initialBearing] = bearings(line)
  const arrowWidth = resolution * widthFactor
  const PA = line[0].destinationPoint(arrowWidth, initialBearing - bearing + 180)
  const PB = line[0].destinationPoint(arrowWidth, initialBearing + bearing - 180)
  return [PA, line[0], PB]
}

const closedArrowEnd = (line, resolution, widthFactor = 15, bearing = 145) => {
  const [finalBearing] = bearings(line).reverse()
  const arrowWidth = resolution * widthFactor
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  const I = LatLon.intersection(line[0], finalBearing, PA, finalBearing + 90)
  return [PA, line[1], PB, I, PA]
}

const closedArrowStart = (line, resolution, widthFactor = 15, bearing = 145) => {
  const [initialBearing] = bearings(line)
  const arrowWidth = resolution * widthFactor
  const PA = line[0].destinationPoint(arrowWidth, initialBearing - bearing + 180)
  const PB = line[0].destinationPoint(arrowWidth, initialBearing + bearing - 180)
  const I = LatLon.intersection(line[0], initialBearing, PA, initialBearing - 90)
  return [PA, line[0], PB, I, PA]
}

const doubleArrow = (line, resolution, widthFactor = 15, bearing = 145) => {
  const [finalBearing] = bearings(line).reverse()
  const arrowWidth = resolution * widthFactor
  const C = line[1].destinationPoint(-resolution * 5, finalBearing)
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  const PC = C.destinationPoint(arrowWidth, finalBearing - bearing)
  const PD = C.destinationPoint(arrowWidth, finalBearing + bearing)
  return [PA, line[1], PB, PD, C, PC, PA]
}

const zigzag = (line, resolution) => {
  const [initialBearing, finalBearing] = bearings(line)
  const bearing = (initialBearing + finalBearing) / 2
  const width = resolution * 10
  const steps = distance(line) / width
  const [PA1] = translateLine(resolution * 10, +90)(line)
  const [PB1] = translateLine(resolution * 10, -90)(line)
  return R.range(0, steps).reduce((acc, i) => K(acc)(acc => {
    const point = i % 2 === 0 ? PA1 : PB1
    acc.push(point.destinationPoint((i + 0.25) * width, bearing))
  }), [])
}

const multiLineString = lines =>
  new geom.MultiLineString(lines.map(line => line.map(fromLatLon)))

const lineStyle = (feature, lines) => {
  const styles = defaultStyle(feature)

  // It is quite possible that feature's extent is too small
  // to construct a valid geometry. Use default style in this case.

  try {
    const geometry = multiLineString(lines)
    return K(styles)(xs => xs.forEach(s => s.setGeometry(geometry)))
  } catch (err) {
    return styles
  }
}


const linearTarget = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const width = resolution * 10
  const [PA1, PA2] = translateLine(width, +90)(line)
  const [PB1, PB2] = translateLine(width, -90)(line)
  return lineStyle(feature, [line, [PA1, PB1], [PA2, PB2]])
}

export const geometries = {
  'G*F*LT----': linearTarget,
  'G*F*LTS---': linearTarget,
  'G*F*LTF---': linearTarget
}

geometries['G*G*OLKA--'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const [initialBearing] = bearings(line)
  const length = distance(line)
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
  const line = coordinates(feature).map(toLatLon)
  const arrow = doubleArrow(line, resolution)
  return lineStyle(feature, [[line[0], arrow[4]], arrow])
}

geometries['G*G*OLKGS-'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  return lineStyle(feature, [line, simpleArrowEnd(line, resolution)])
}

geometries['G*G*PF----'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const [finalBearing] = bearings(line).reverse()
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
  const line = coordinates(feature).map(toLatLon)
  const arrowEnd = closedArrowEnd(line, resolution)
  const arrowStart = closedArrowStart(line, resolution)
  return lineStyle(feature, [
    [arrowStart[3], arrowEnd[3]],
    arrowEnd,
    arrowStart
  ])
}

geometries['G*M*BCL---'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const arrowEnd = simpleArrowEnd(line, resolution, 15, -35)
  const arrowStart = simpleArrowStart(line, resolution, 15, -35)
  return lineStyle(feature, [
    line,
    arrowEnd,
    arrowStart
  ])
}

geometries['G*M*BCR---'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const arrowEnd = simpleArrowEnd(line, resolution, 25, -60)
  const arrowStart = simpleArrowStart(line, resolution, 25, -60)
  return lineStyle(feature, [
    line,
    arrowEnd,
    arrowStart
  ])
}

geometries['G*M*OEF---'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const [initialBearing, finalBearing] = bearings(line)
  const length = distance(line)
  const PA = line[0].destinationPoint(length * 0.2, initialBearing)
  const PB = line[1].destinationPoint(length * 0.2, finalBearing - 180)
  const arrow = closedArrowEnd(line, resolution)
  return lineStyle(feature, [
    [line[0], PA, ...zigzag([PA, PB], resolution), PB, arrow[3]],
    arrow
  ])
}

geometries['G*M*SW----'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const width = resolution * 20
  const [PA1, PA2] = translateLine(width, +90)(line)
  return lineStyle(feature, [[PA1, ...line, PA2]])
}

geometries['G*O*HN----'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const [initialBearing, finalBearing] = bearings(line)
  const width = resolution * 25
  const PA = line[1].destinationPoint(width, finalBearing + 120)
  const PB = line[0].destinationPoint(width, initialBearing - 60)
  return lineStyle(feature, [[PB, ...line, PA]])
}

geometries['G*T*A-----'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const [initialBearing] = bearings(line)
  const length = distance(line)
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
  const line = coordinates(feature).map(toLatLon)
  const [initialBearing] = bearings(line)
  const length = distance(line)
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
  const line = coordinates(feature).map(toLatLon)
  const [finalBearing] = bearings(line).reverse()
  const width = resolution * 25
  const PB1 = line[1].destinationPoint(-width, finalBearing)
  const PB2 = line[1].destinationPoint(width, finalBearing + 90)
  const PB3 = line[1].destinationPoint(width, finalBearing - 90)
  const [PA1, PA2] = translateLine(width / 1.5, +90)([line[0], PB1])
  const [PA4, PA3] = translateLine(width / 1.5, -90)([line[0], PB1])
  return lineStyle(feature, [
    [PA1, PA2, PA3, PA4, PA1],
    [PB1, PB2, PB3, PB1]
  ])
}

geometries['G*S*LCM---'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const [finalBearing] = bearings(line).reverse()
  const width = resolution * 25
  const PB1 = line[1].destinationPoint(-width, finalBearing)
  const PB2 = PB1.destinationPoint(width, finalBearing + 90)
  const PB3 = PB1.destinationPoint(width, finalBearing - 90)
  const [PA1, PA2] = translateLine(width / 1.5, +90)([line[0], PB1])
  const [PA4, PA3] = translateLine(width / 1.5, -90)([line[0], PB1])
  return lineStyle(feature, [[PA3, PA4, PA1, PA2, PB2, line[1], PB3, PA3]])
}

geometries['G*T*F-----'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const [initialBearing, finalBearing] = bearings(line)
  const length = distance(line)
  const PA = line[0].destinationPoint(length * 0.2, initialBearing)
  const PB = line[1].destinationPoint(length * 0.2, finalBearing - 180)
  return lineStyle(feature, [
    [line[0], PA, ...zigzag([PA, PB], resolution), PB, line[1]],
    simpleArrowEnd(line, resolution)
  ])
}

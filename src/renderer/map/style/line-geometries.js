import * as geom from 'ol/geom'
import { getTransform } from 'ol/proj'
import * as R from 'ramda'
import { K, T } from '../../../shared/combinators'
import LatLon from 'geodesy/latlon-spherical.js'

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

const simpleArrow = (line, resolution, widthFactor = 15, bearing = 145) => {
  const [finalBearing] = bearings(line).reverse()
  const arrowWidth = resolution * widthFactor
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  return [PA, line[1], PB]
}

const closedArrow = (line, resolution, widthFactor = 15, bearing = 145) => {
  const [finalBearing] = bearings(line).reverse()
  const arrowWidth = resolution * widthFactor
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  const I = LatLon.intersection(line[0], finalBearing, PA, finalBearing + 90)
  return [PA, line[1], PB, I, PA]
}

const doubleArrow = (line, resolution) => {
  const [finalBearing] = bearings(line).reverse()
  const arrowWidth = resolution * 15
  const C = line[1].destinationPoint(resolution * 4, -finalBearing)
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - 145)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + 145)
  const PC = C.destinationPoint(arrowWidth, finalBearing - 145)
  const PD = C.destinationPoint(arrowWidth, finalBearing + 145)
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

const lineStyle = (feature, geometry) =>
  K(defaultStyle(feature))(xs => xs.forEach(s => s.setGeometry(geometry)))

const linearTarget = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const width = resolution * 10
  const [PA1, PA2] = translateLine(width, +90)(line)
  const [PB1, PB2] = translateLine(width, -90)(line)
  return lineStyle(feature, multiLineString([line, [PA1, PB1], [PA2, PB2]]))
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
  return lineStyle(feature, multiLineString([
    [line[0], PA], [PB, line[1]],
    simpleArrow(line, resolution),
    [PA1, PA2, PB1, PB2, PA1]
  ]))
}

geometries['G*G*OLKGM-'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const arrow = doubleArrow(line, resolution)
  return lineStyle(feature, multiLineString([[line[0], arrow[4]], arrow]))
}

geometries['G*G*OLKGS-'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  return lineStyle(feature, multiLineString([line, simpleArrow(line, resolution)]))
}

geometries['G*G*PF----'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const [finalBearing] = bearings(line).reverse()
  const PB = line[1].destinationPoint(resolution * -8, finalBearing)

  const s1 = lineStyle(feature, multiLineString([
    [line[0], PB],
    simpleArrow([line[0], PB], resolution, 20, 130)
  ]))

  const s2 = lineStyle(feature, multiLineString([simpleArrow(line, resolution, 20, 130)]))
    .map(s => K(s)(s => s.getStroke().setLineDash([10, 7])))

  return s1.concat(s2)
}

// TODO: G*M*BCF---
// TODO: G*M*BCL---
// TODO: G*M*BCR---

geometries['G*M*OEF---'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const [initialBearing, finalBearing] = bearings(line)
  const length = distance(line)
  const PA = line[0].destinationPoint(length * 0.2, initialBearing)
  const PB = line[1].destinationPoint(length * 0.2, finalBearing - 180)
  const arrow = closedArrow(line, resolution)
  return lineStyle(feature, multiLineString([
    [line[0], PA, ...zigzag([PA, PB], resolution), PB, arrow[3]],
    arrow
  ]))
}

// TODO: G*O*HN----
// TODO: G*S*LCH---
// TODO: G*S*LCM---
// TODO: G*T*A-----
// TODO: G*T*AS----

geometries['G*M*SW----'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const width = resolution * 20
  const [PA1, PA2] = translateLine(width, +90)(line)
  return lineStyle(feature, multiLineString([[PA1, ...line, PA2]]))
}

geometries['G*T*F-----'] = (feature, resolution) => {
  const line = coordinates(feature).map(toLatLon)
  const [initialBearing, finalBearing] = bearings(line)
  const length = distance(line)
  const PA = line[0].destinationPoint(length * 0.2, initialBearing)
  const PB = line[1].destinationPoint(length * 0.2, finalBearing - 180)
  return lineStyle(feature, multiLineString([
    [line[0], PA, ...zigzag([PA, PB], resolution), PB, line[1]],
    simpleArrow(line, resolution)
  ]))
}

import LatLon from 'geodesy/latlon-spherical.js'
import * as G from './geodesy'

export const closedArrowEnd = (line, resolution, widthFactor = 15, bearing = 145) => {
  const finalBearing = G.finalBearing(line)
  const arrowWidth = resolution * widthFactor
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  const I = LatLon.intersection(line[0], finalBearing, PA, finalBearing + 90)
  return [PA, line[1], PB, I, PA]
}

export const closedArrowStart = (line, resolution, widthFactor = 15, bearing = 145) => {
  const initialBearing = G.initialBearing(line)
  const arrowWidth = resolution * widthFactor
  const PA = line[0].destinationPoint(arrowWidth, initialBearing - bearing + 180)
  const PB = line[0].destinationPoint(arrowWidth, initialBearing + bearing - 180)
  const I = LatLon.intersection(line[0], initialBearing, PA, initialBearing - 90)
  return [PA, line[0], PB, I, PA]
}

export const simpleArrowEnd = (line, resolution, widthFactor = 15, bearing = 145) => {
  const finalBearing = G.finalBearing(line)
  const arrowWidth = resolution * widthFactor
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  return [PA, line[1], PB]
}

export const simpleArrowStart = (line, resolution, widthFactor = 15, bearing = 145) => {
  const initialBearing = G.initialBearing(line)
  const arrowWidth = resolution * widthFactor
  const PA = line[0].destinationPoint(arrowWidth, initialBearing - bearing + 180)
  const PB = line[0].destinationPoint(arrowWidth, initialBearing + bearing - 180)
  return [PA, line[0], PB]
}

export const simpleCrossEnd = (line, resolution, widthFactor = 10) => {
  const finalBearing = G.finalBearing(line)
  const arrowWidth = resolution * widthFactor
  const PA0 = line[1].destinationPoint(arrowWidth, finalBearing - 45)
  const PA1 = line[1].destinationPoint(-arrowWidth, finalBearing - 45)
  const PB0 = line[1].destinationPoint(arrowWidth, finalBearing + 45)
  const PB1 = line[1].destinationPoint(-arrowWidth, finalBearing + 45)
  return [[PA0, PA1], [PB0, PB1]]
}

export const slashEnd = (line, angle, resolution, widthFactor = 15) => {
  const finalBearing = G.finalBearing(line)
  const arrowWidth = resolution * widthFactor
  const PA0 = line[1].destinationPoint(arrowWidth, finalBearing - angle)
  const PA1 = line[1].destinationPoint(-arrowWidth, finalBearing - angle)
  return [PA0, PA1]
}

export const doubleArrow = (line, resolution, widthFactor = 15, bearing = 145) => {
  const finalBearing = G.finalBearing(line)
  const arrowWidth = resolution * widthFactor
  const C = line[1].destinationPoint(-resolution * 5, finalBearing)
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  const PC = C.destinationPoint(arrowWidth, finalBearing - bearing)
  const PD = C.destinationPoint(arrowWidth, finalBearing + bearing)
  return [PA, line[1], PB, PD, C, PC, PA]
}

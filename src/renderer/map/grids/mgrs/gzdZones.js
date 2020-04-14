import { createLine } from '../utils'
import { fromLonLat, toLonLat } from 'ol/proj'
import { longitudeGzdNorwayZones } from './norway'

export const getGzdGrid = (extent, callback) => {
  const lines = []
  const startPoint = getGzdPoint(toLonLat([extent[0], extent[1]]), false)
  const endPoint = getGzdPoint(toLonLat([extent[2], extent[3]]), true)
  let x = startPoint[0]
  let y = startPoint[1]
  while (x < endPoint[0]) {
    while (y < endPoint[1] && y < 72) {
      if (x === 6 && y === 56) {
        // thanks norway
        lines.push(createLine(fromLonLat([0, 56]), fromLonLat([3, 56]), 1))
        lines.push(createLine(fromLonLat([3, 56]), fromLonLat([3, 64]), 1))
        lines.push(createLine(fromLonLat([3, 56]), fromLonLat([12, 56]), 1))
      } else {
        lines.push(createLine(fromLonLat([x, y]), fromLonLat([x + 6, y]), 1))
        lines.push(createLine(fromLonLat([x, y]), fromLonLat([x, y + 8]), 1))
      }
      y = y + 8
    }
    lines.push(createLine(fromLonLat([x, y]), fromLonLat([x + 6, y]), 1))
    x = x + 6
    y = -80
  }
  const generateXSegment = (lines) => {
    let x = -180
    const y = 72
    while (x < 180) {
      lines.push(createLine(fromLonLat([x, y]), fromLonLat([x + 6, y]), 1))
      lines.push(createLine(fromLonLat([x, y]), fromLonLat([x, y + 12]), 1))
      lines.push(createLine(fromLonLat([x, y + 12]), fromLonLat([x + 6 + 6, y + 12]), 1))
      // thanks norway (everything but else)
      if (x === 0 || x === 33) {
        x = x + 9
      } else if (x === 9 || x === 21) {
        x = x + 12
      } else {
        x = x + 6
      }
    }
  }
  generateXSegment(lines)
  callback(lines)
}
/**
 * returns Array of [Longitude,latitude] of the GZD End/Startpoint
 * @param {[number,number]} point [longitude,latitude]
 * @param {boolean} isEndPoint
 */
export const getGzdPoint = (point, isEndPoint) => {
  let long = -180
  while (long + 6 < point[0]) {
    long = long + 6
  }
  let lat = -80
  while (lat + 8 < point[1]) {
    lat = lat + 8
  }
  if (isEndPoint) {
    long = long + 6
    lat = lat + 8
  }
  // thanks norway
  long = longitudeGzdNorwayZones(long, lat, point, isEndPoint)
  return [long, lat]
}


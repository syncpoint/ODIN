import { createLine } from '../utils'
import { fromLonLat, toLonLat } from 'ol/proj'

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

/**
 * function required to get the longitude for GZD points for the weird norway regions
 * @param {number} long longitude for a GZD Point if norway would follow the MGRS Convention
 * @param {number} lat latitude for a GZD Point
 * @param {[number,number]} point point within a GZD Point
 */
const longitudeGzdNorwayZones = (long, lat, point, isEndPoint) => {
  if ((long === 6 && lat === 64 && isEndPoint) || (long === 0 && lat === 56 && long + 3 < point[0])) {
    long = 3
  } else if ((long === 12 && lat === 80) || (long === 6 && lat === 72 && long + 3 < point[0])) {
    long = 9
  } else if ((long === 24 && lat === 80) || (long === 18 && lat === 72 && long + 3 < point[0]) || (long === 18 && lat === 80)) {
    long = 21
  } else if ((long === 36 && lat === 80) || (long === 30 && lat === 72 && long + 3 < point[0]) || (long === 30 && lat === 80)) {
    long = 33
  }
  return long
}

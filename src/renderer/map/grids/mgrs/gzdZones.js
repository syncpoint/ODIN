import { createLine } from '../utils'
import { fromLonLat, toLonLat } from 'ol/proj'
import { toMgrs } from './mgrs'

/**
 * Generates GZD Grid
 * @typedef {import("ol/Feature")} Feature
 * @returns {Feature[]} Array of ol/Feature
 */
export const getGzdGrid = () => {
  const lines = []
  let x = -180
  let y = -80
  while (x < 180) {
    while (y < 72) {
      if (x === 6 && y === 56) {
        // thanks norway
        lines.push(createGzdLine(fromLonLat([0, 56]), fromLonLat([3, 56]), 1))
        lines.push(createGzdLine(fromLonLat([3, 56]), fromLonLat([3, 64]), 1))
        lines.push(createGzdLine(fromLonLat([3, 56]), fromLonLat([12, 56]), 1))
      } else {
        lines.push(createGzdLine(fromLonLat([x, y]), fromLonLat([x + 6, y]), 1))
        lines.push(createGzdLine(fromLonLat([x, y]), fromLonLat([x, y + 8]), 1))
      }
      y = y + 8
    }
    lines.push(createGzdLine(fromLonLat([x, y]), fromLonLat([x + 6, y]), 1))
    x = x + 6
    y = -80
  }
  const generateXSegment = () => {
    const lines = []
    let x = -180
    const y = 72
    while (x < 180) {
      lines.push(createGzdLine(fromLonLat([x, y]), fromLonLat([x + 6, y]), 1))
      lines.push(createGzdLine(fromLonLat([x, y]), fromLonLat([x, y + 12]), 1))
      lines.push(createGzdLine(fromLonLat([x, y + 12]), fromLonLat([x + 6 + 6, y + 12]), 1))
      // thanks norway (everything but else)
      if (x === 0 || x === 33) {
        x = x + 9
      } else if (x === 9 || x === 21) {
        x = x + 12
      } else {
        x = x + 6
      }
    }
    return lines
  }
  const xSegment = generateXSegment()
  lines.push(...xSegment)
  return lines
}

const createGzdLine = (startPoint, endPoint, detail) => {
  const text = getLineText(startPoint, endPoint) || ''
  return createLine(startPoint, endPoint, detail, text)
}

/**
 * Used to generate the Line text
 * @param {[Number,Number]} startpoint startpoint of the GZD Segment
 * @param {[Number,Number]} endPoint endPoint of the GZD Segment
 * @returns {String} Line text
 */
const getLineText = (startPoint, endPoint) => {
  const lonLat1 = toLonLat(startPoint)
  const lonLat2 = toLonLat(endPoint)
  const mgrs = toMgrs([(lonLat1[0] + lonLat2[0]) / 2, (lonLat1[1] + lonLat2[1]) / 2])
  if (mgrs.length >= 3) {
    return mgrs.substr(0, 3)
  }
}

/**
 * returns Array of [Longitude,latitude] of the GZD End/Startpoint
 * @param {[number,number]} point [longitude,latitude]
 * @param {boolean} isEndPoint
 */
export const getGzdPoint = (point, isEndPoint) => {
  const calcSegmentPosition = (position, step, isEndPoint) => {
    const segmentPosition = Math.floor(position / step) * step
    return isEndPoint ? segmentPosition + step : segmentPosition
  }
  const long = calcSegmentPosition(point[0], 6, isEndPoint)
  const lat = calcSegmentPosition(point[1], 8, isEndPoint)

  const longitudeGzdNorwayZones = (long, lat, point, isEndPoint) => {
    if ((long === 6 && lat === 64 && isEndPoint) || (long === 0 && lat === 56 && long + 3 < point[0])) {
      return 3
    } else if ((long === 12 && lat === 80) || (long === 6 && lat === 72 && long + 3 < point[0])) {
      return 9
    } else if ((long === 24 && lat === 80) || (long === 18 && lat === 72 && long + 3 < point[0]) || (long === 18 && lat === 80)) {
      return 21
    } else if ((long === 36 && lat === 80) || (long === 30 && lat === 72 && long + 3 < point[0]) || (long === 30 && lat === 80)) {
      return 33
    }
  }
  const norwayLong = longitudeGzdNorwayZones(long, lat, point, isEndPoint)
  return norwayLong ? [norwayLong, lat] : [long, lat]
}

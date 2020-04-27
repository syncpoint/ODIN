
import { forward, inverse } from 'mgrs'

export const SEGMENTIDENTIEFERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

/**
 * Conversion of lat/lon to MGRS.
 * @param {[number]} Array for lon lat coords [lon,lat]
 * @returns {string} MGRS string
 * */
export const toMgrs = (lonlat) => {
  const mgrs = forward(lonlat, 5)
  if (mgrs.length === 14) {
    return `0${mgrs}`
  }
  return mgrs
}

/**
 * Conversion of MGRS string to lat/lon
 * @param {string} MGRS string
 * @returns {[number]} Array for lon lat coords [lon,lat]
 * */
export const fromMgrs = (mgrs) => {
  return mgrs.startsWith('0') ? inverse(mgrs.substr(1)) : inverse(mgrs)
}


const NUMERICSEGMENTMAXIMUM = 99999
/**
 * creates a MGRS String
 * @param {Number} xGZD xGZD Zone 01-60
 * @param {String} band band A-Z
 * @param {String} e100k easting for 100km segments A-Z omitting I and O
 * @param {String} n100k Northing for 100km segments A-V omitting I and O
 * @param {Number} x 0-99999 100000 changes 100km segment
 * @param {Number} y 0-99999 100000 changes 100km segment
 */
export const buildMgrsString = (xGZD, band, e100k, n100k, x = 0, y = 0) => {

  const stringGZD = xGZD < 10 ? `0${xGZD}` : `${xGZD}`
  if (x <= NUMERICSEGMENTMAXIMUM && y <= NUMERICSEGMENTMAXIMUM) {
    return `${stringGZD}${band}${e100k}${n100k}${fromatDetailLevel(x)}${fromatDetailLevel(y)}`
  } else if (x > NUMERICSEGMENTMAXIMUM && y > NUMERICSEGMENTMAXIMUM) {
    const newE100k = e100k === 'Z' ? 'A' : getNext(e100k)
    const newN100k = n100k === 'V' ? 'A' : getNext(n100k)
    return `${stringGZD}${band}${newE100k}${newN100k}${fromatDetailLevel(0)}${fromatDetailLevel(0)}`
  } else if (x > NUMERICSEGMENTMAXIMUM) {
    const newE100k = e100k === 'Z' ? 'A' : getNext(e100k)
    return `${stringGZD}${band}${newE100k}${n100k}${fromatDetailLevel(0)}${fromatDetailLevel(y)}`
  } else if (y > NUMERICSEGMENTMAXIMUM) {
    const newN100k = n100k === 'V' ? 'A' : getNext(n100k)
    return `${stringGZD}${band}${e100k}${newN100k}${fromatDetailLevel(x)}${fromatDetailLevel(0)}`
  }
}
export const addStep = (mgrs, isHorizontal, step) => {
  const xGZD = Number(mgrs.substr(0, 2))
  const band = mgrs.substr(2, 1)
  const e100k = mgrs.substr(3, 1)
  const n100k = mgrs.substr(4, 1)
  const x = Number(mgrs.substr(5, 5))
  const y = Number(mgrs.substr(10, 5))
  if (isHorizontal) {
    return buildMgrsString(xGZD, band, e100k, n100k, x + step, y)
  }
  return buildMgrsString(xGZD, band, e100k, n100k, x, y + step)
}

/**
 * Formats number to a MGRS easting/northing String with the accuracy of 5
 * @param {Number} number
 * @returns {String} MGRS easting/northing String (input=10 => returns '00010')
 */
export const fromatDetailLevel = (number) => {
  const min = '00000'
  if (min.length >= number.toString().length) {
    return min.substring(0, min.length - number.toString().length) + number.toString()
  }
  // maximum
  return '99999'
}

export const getNext = (band) => {
  const segment = isNaN(band) ? Number(band.charCodeAt(0)) : band
  const nextBand = String.fromCharCode(segment + 1)
  if (nextBand === 'O' || nextBand === 'I') {
    return String.fromCharCode(segment + 2)
  }
  return nextBand
}


export const getPrevious = (band) => {
  const segment = isNaN(band) ? Number(band.charCodeAt(0)) : band
  const previousBand = String.fromCharCode(segment - 1)
  if (previousBand === 'O' || previousBand === 'I') {
    return String.fromCharCode(segment - 2)
  }
  return previousBand
}


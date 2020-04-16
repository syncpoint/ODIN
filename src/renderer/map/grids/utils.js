import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { getCenter, getWidth } from 'ol/extent'
import { forward, inverse } from 'mgrs'


/**
 * Conversion of lat/lon to MGRS.
 * @param {[number]} Array for lon lat coords [lon,lat]
 * @returns {string} MGRS string
 * */
export const toMgrs = (lonlat) => {
  let mgrs = forward(lonlat, 5)
  if (mgrs.length === 14) {
    mgrs = `0${mgrs}`
  }
  return mgrs
}

/**
 * Conversion of MGRS string to lat/lon
 * @param {string} MGRS string
 * @returns {[number]} Array for lon lat coords [lon,lat]
 * */
export const fromMgrs = (mgrs) => {
  let lonlat
  if (mgrs.startsWith('0')) {
    lonlat = inverse(mgrs.substr(1))
  } else {
    lonlat = inverse(mgrs)
  }
  return lonlat
}

/**
 * creates a MGRS String
 * @param {String} xGZD xGZD Zone 01-60
 * @param {String} ySegment band A-Z
 * @param {String} e100k easting for 100km segments A-Z omitting I and O
 * @param {String} n100k Northing for 100km segments A-V omitting I and O
 * @param {Number} x 0-100000 100000 changes 100km segment
 * @param {Number} y 0-100000 100000 changes 100km segment
 */
export const buildMgrsString = (xGZD, ySegment, e100k, n100k, x = 0, y = 0) => {
  xGZD = xGZD < 10 ? `0${xGZD}` : xGZD
  if (x < 100000 && y < 100000) {
    return `${xGZD}${ySegment}${e100k}${n100k}${fromatDetailLevel(x)}${fromatDetailLevel(y)}`
  } else if (x >= 100000) {
    const newE100k = n100k === 'Z' ? 'A' : getNext(e100k)
    return `${xGZD}${ySegment}${newE100k}${n100k}${fromatDetailLevel(0)}${fromatDetailLevel(y)}`
  } else if (y >= 100000) {
    const newN100k = n100k === 'V' ? 'A' : getNext(n100k)
    return `${xGZD}${ySegment}${e100k}${newN100k}${fromatDetailLevel(x)}${fromatDetailLevel(0)}`
  }
}

const getNext = (band) => {
  let segment = band
  if (isNaN(segment)) {
    segment = Number(band.charCodeAt(0))
  }
  let nextBand = String.fromCharCode(segment + 1)
  if (nextBand === 'O' || nextBand === 'I') {
    nextBand = String.fromCharCode(segment + 2)
  }
  return nextBand
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

export const createLine = (startPoint, endPoint, zIndex, text, wrapBack) => {
  if (wrapBack) {
    startPoint[0] = wrapBack(startPoint[0])
    endPoint[0] = wrapBack(endPoint[0])
  }
  const feature = new Feature({
    geometry: new LineString([startPoint[0], startPoint[1], endPoint[0], endPoint[1]], 'XY'),
    zIndex: zIndex,
    text: text
  })
  return feature
}

/**
 * cuts extent into max. two extents for each world the view is in
 * @param {[Number]} extent view Extent
 * @param {Object} projection view projection
 * @returns {[[Number]]} array of extent
 */
export const splitWorlds = (extent, projection) => {
  const extents = []
  const projectionExtent = projection.getExtent()
  if (projection.canWrapX() && (extent[0] < projectionExtent[0] || extent[2] >= projectionExtent[2])) {
    const worldWidth = getWidth(projectionExtent)
    const worldsAway1 = getWorldsAway(extent[0], projectionExtent[0], worldWidth)
    const worldsAway2 = getWorldsAway(extent[2], projectionExtent[0], worldWidth)
    if (worldsAway1 !== worldsAway2) {
      const worldsAway = Math.max(worldsAway1, worldsAway2)
      const extent1 = [...extent]
      extent1[0] = projectionExtent[0] + worldsAway * worldWidth + 1
      extents.push(extent1)
      const extent2 = [...extent]
      extent2[2] = projectionExtent[0] + worldsAway * worldWidth - 1
      extents.push(extent2)
    } else {
      extents.push(extent)
    }
  } else {
    extents.push(extent)
  }
  return extents
}
/**
 * transforms the extent to World 1
 * @param {[Number]} extent view Extent
 * @param {Object} projection view projection
 * @returns {{e: [Number], f: function}} e: transformed extent,  f: funbction to transform x coordinates back to the projected world
 */
export const wrapX = (extent, projection) => {
  const projectionExtent = projection.getExtent()
  const center = getCenter(extent)
  if (projection.canWrapX() && (center[0] < projectionExtent[0] || center[0] >= projectionExtent[2])) {
    const worldWidth = getWidth(projectionExtent)
    const worldsAway = getWorldsAway(center[0], projectionExtent[0], worldWidth)
    extent[0] -= worldsAway * worldWidth
    extent[2] -= worldsAway * worldWidth

    const wrapBack = (x) => {
      x += worldsAway * worldWidth
      return x
    }
    return { e: extent, f: wrapBack }
  }
  return { e: extent }
}

const getWorldsAway = (x, minX, worldWith) => {
  return Math.floor(
    (x - minX) / worldWith
  )
}

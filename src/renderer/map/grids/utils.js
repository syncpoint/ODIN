import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { getCenter, getWidth } from 'ol/extent'

const min = '00000'

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
  let newBand = String.fromCharCode(segment + 1)
  if (newBand === 'O' || newBand === 'I') {
    newBand = String.fromCharCode(segment + 2)
  }
  return newBand
}

export const fromatDetailLevel = (number) => {
  if (min.length >= number.toString().length) {
    return min.substring(0, min.length - number.toString().length) + number.toString()
  }
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
 * should check if point is within min/max points
 * @param {LatLon} point target point
 * @param {LatLon} min min point
 * @param {LatLon} max max point
 */
export const isPointWithin = (point, min, max) => {
  return (point.lat > min.lat && point.lon > min.lon && point.lat < max.lat && point.lon < max.lon)
}

/**
 * should check if targetMGRS is withing stepRange
 * only needed for detailed Grids when the Parent Grid is has a bigger angle (GZD Border for grids<100k) or Extended Norway zones
 * @param {Mgrs} targetMGRS
 * @param {Mgrs} bottomLeftMGRS
 * @param {Mgrs} bottomRightMGRS
 * @param {Mgrs} topLeftMGRS
 * @param {Mgrs} topRightMGRS
 * @param {Number} step
 */
export const mgrsWithinStep = (targetMGRS, bottomLeftMGRS, bottomRightMGRS, topLeftMGRS, topRightMGRS, step) => {
  if (bottomLeftMGRS.zone === targetMGRS.zone && bottomLeftMGRS.band === targetMGRS.band && bottomLeftMGRS.n100k === targetMGRS.n100k && bottomLeftMGRS.e100k === targetMGRS.e100k) {
    return (bottomLeftMGRS.easting <= targetMGRS.easting && bottomLeftMGRS.northing <= targetMGRS.northing &&
      bottomLeftMGRS.easting + step > targetMGRS.easting && bottomLeftMGRS.northing + step > targetMGRS.northing)
  } else if (bottomRightMGRS.zone === targetMGRS.zone && bottomRightMGRS.band === targetMGRS.band && bottomRightMGRS.n100k === targetMGRS.n100k && bottomRightMGRS.e100k === targetMGRS.e100k) {
    return (bottomRightMGRS.easting >= targetMGRS.easting && bottomRightMGRS.northing <= targetMGRS.northing &&
      bottomRightMGRS.easting - step < targetMGRS.easting && bottomRightMGRS.northing + step > targetMGRS.northing)
  } else if (topLeftMGRS.zone === targetMGRS.zone && topLeftMGRS.band === targetMGRS.band && topLeftMGRS.n100k === targetMGRS.n100k && topLeftMGRS.e100k === targetMGRS.e100k) {
    return (topLeftMGRS.easting <= targetMGRS.easting && topLeftMGRS.northing > targetMGRS.northing &&
      bottomRightMGRS.easting + step > targetMGRS.easting && bottomRightMGRS.northing - step < targetMGRS.northing)
  } else if (topRightMGRS.zone === targetMGRS.zone && topRightMGRS.band === targetMGRS.band && topRightMGRS.n100k === targetMGRS.n100k && topRightMGRS.e100k === targetMGRS.e100k) {
    return (topRightMGRS.easting >= targetMGRS.easting && topRightMGRS.northing >= targetMGRS.northing &&
      topRightMGRS.easting - step < targetMGRS.easting && topRightMGRS.northing - step < targetMGRS.northing)
  }
  return false
}

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
  return { e: extent, f: undefined }
}

const getWorldsAway = (x, minX, worldWith) => {
  return Math.floor(
    (x - minX) / worldWith
  )
}

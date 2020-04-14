import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { getCenter, getWidth } from 'ol/extent'

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

import { buildMgrsString, fromMgrs, toMgrs } from './mgrs'
import { boundingExtent, intersects } from 'ol/extent'
import { fromLonLat } from 'ol/proj'

/**
 * calculates if extent is within the Segment or if the Segment is within the extent
 *@param {Number} gzd Horizontal GZD Number 1-60
 * @param {String} band band Vertical GZD band 'C'-'X' (omitting 'I' and 'O')
 * @param {String} e100k Horizonal 100k Segment 'A'-'Z' (omitting 'I' and 'O')
 * @param {String} n100k Vertical 100k Segment 'A'-'V' (omitting 'I' and 'O')
 * @param {Number} x  MGRS argument for easting
 * @param {Number} y  MGRS argument for northing
 * @param {Number} step step for easting and northing ( for 10 km Grid it is 10000)
 * @param {[Number]} extent used to check if segments intersects
 * @returns {Boolean}
 */
export const intersectsSegment = (gzd, band, e100k, n100k, x, y, step, extent) => {
  const mgrsBottomLeft = buildMgrsString(gzd, band, e100k, n100k, x, y)
  const mgrsBottomRight = buildMgrsString(gzd, band, e100k, n100k, x + step, y)
  const mgrsTopLeft = buildMgrsString(gzd, band, e100k, n100k, x, y + step)
  const mgrsTopRight = buildMgrsString(gzd, band, e100k, n100k, x + step, y + step)
  const segmentBottomLeft = fromMgrs(mgrsBottomLeft)
  const segmentBottomRight = fromMgrs(mgrsBottomRight)
  const segmentTopLeft = fromMgrs(mgrsTopLeft)
  const segmentTopRight = fromMgrs(mgrsTopRight)
  const segmentExtent = boundingExtent([
    fromLonLat([segmentBottomLeft[0], segmentBottomLeft[1]]),
    fromLonLat([segmentBottomRight[0], segmentBottomRight[1]]),
    fromLonLat([segmentTopLeft[0], segmentTopLeft[1]]),
    fromLonLat([segmentTopRight[0], segmentTopRight[1]])
  ])
  return intersects(extent, segmentExtent)
}

/**
 * rebuilds mgrs and compares it with a Mgrs String
 * @param {String} mgrs MGRS String
 * @param {String} targetMgrs MGRS String
 */
export const isValidGzdZone = (mgrs, targetMgrs = mgrs) => {
  const controllMGRS = rebuildMGRS(mgrs)
  return controllMGRS.substr(0, 2) === targetMgrs.substr(0, 2)
}

/**
 * rebuilds mgrs and compares it with a Mgrs String
 * @param {String} mgrs MGRS String
 * @param {String} targetMgrs MGRS String
 */
export const isValidBand = (mgrs, targetMgrs = mgrs) => {
  const controllMGRS = rebuildMGRS(mgrs)
  return controllMGRS.substr(2, 1) === targetMgrs.substr(2, 1)
}

/**
 * rebuilds mgrs and compares it with a Mgrs String
 * @param {String} mgrs MGRS String
 * @param {String} targetMgrs MGRS String
 */
export const isValidGzdSegment = (mgrs, targetMgrs = mgrs) => {
  const controllMGRS = rebuildMGRS(mgrs)
  return controllMGRS.substr(0, 3) === targetMgrs.substr(0, 3)
}

/**
 * rebuilds mgrs and compares it with a Mgrs String
 * @param {String} mgrs MGRS String
 * @param {String} targetMgrs MGRS String
 */
export const isValid100kSegment = (mgrs, targetMgrs = mgrs) => {
  const controllMGRS = rebuildMGRS(mgrs)
  return controllMGRS.substr(0, 5) === targetMgrs.substr(0, 5)
}


/**
 * rebuilds mgrs and compares it with a Mgrs String
 * @param {String} mgrs MGRS String
 * @param {String} targetMgrs MGRS String
 */
const rebuildMGRS = (mgrs) => {
  const lonlat = fromMgrs(mgrs)
  const newMgrs = toMgrs([lonlat[0], lonlat[1]], 5)
  return newMgrs
}

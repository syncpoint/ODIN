import { fromLonLat, toLonLat } from 'ol/proj'
import { createLine, wrapX, splitWorlds } from '../utils'
import { fromMgrs, toMgrs, buildMgrsString, fromatDetailLevel, getPrevious, isValid100kSegment, isValidGzdZone, isValidBand } from './mgrs'
import { getGzdPoint } from './gzdZones'
import { boundingExtent, intersects, equals } from 'ol/extent'

const SQUAREIDENTIEFERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

var loadedExtent
var loadedWrapBack

/**
 * generates Mgrs grid (not including gzd Zones) for extents that overlap the view projection
 * @param {import('ol/extent').Extent} extent ol view extent
 * @param {import('ol/proj/Projection')} projection ol view projection
 * @param {Number} depth detail level of the Grid
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
export const getDetailGrid = (extent, projection, depth) => {
  if (loadedExtent && equals(extent, loadedExtent)) {
    return
  }
  loadedExtent = extent
  const extents = splitWorlds(extent, projection)
  const lines = []
  for (let i = 0; i < extents.length; i++) {
    const { e, f } = wrapX([...extents[i]], projection)
    loadedWrapBack = f
    lines.push(...buildLines(e, depth))
  }
  return lines
}

/**
 * generates Mgrs grid (not including gzd Zones)
 * @param {import('ol/extent').Extent} extent extent within the initial world
 * @param {Number} depth detail level of the Grid
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const buildLines = (extent, depth) => {
  const lines = []
  const getGZDRange = (extent) => {
    const startPoint = toLonLat([extent[0], extent[1]])
    const endPoint = toLonLat([extent[2], extent[3]])

    const bottomLeftMGRS = toMgrs([startPoint[0], startPoint[1]])
    const topRightMGRS = toMgrs([endPoint[0], endPoint[1]])
    const bottomRightMGRS = toMgrs([endPoint[0], startPoint[1]])
    const topLeftMGRS = toMgrs([startPoint[0], endPoint[1]])

    const startGZD = Math.max(Math.min(bottomLeftMGRS.substr(0, 2), topLeftMGRS.substr(0, 2)), 0)
    const endGZD = Math.min(Math.max(topRightMGRS.substr(0, 2), bottomRightMGRS.substr(0, 2)), 60)
    return [startGZD, endGZD]

  }
  const getBandRange = (extent) => {
    const startPoint = toLonLat([extent[0], extent[1]])
    const endPoint = toLonLat([extent[2], extent[3]])
    const bottomLeftMGRS = toMgrs([startPoint[0], startPoint[1]])
    const topRightMGRS = toMgrs([endPoint[0], endPoint[1]])
    const startBand = Math.max(SQUAREIDENTIEFERS.indexOf(bottomLeftMGRS.substr(2, 1)), SQUAREIDENTIEFERS.indexOf('C'))
    const endBand = Math.min(SQUAREIDENTIEFERS.indexOf(topRightMGRS.substr(2, 1)), SQUAREIDENTIEFERS.indexOf('X'))
    return [startBand, endBand]
  }
  const gzdRange = getGZDRange(extent)
  const bandRange = getBandRange(extent)
  for (let gzd = gzdRange[0]; gzd <= gzdRange[1]; gzd++) {
    for (let ySegment = bandRange[0]; ySegment <= bandRange[1]; ySegment++) {
      const band = SQUAREIDENTIEFERS[ySegment]
      const lineGenerator = depth === 0 ? draw100kLines : drawDetailLines
      lines.push(...lineGenerator(gzd, band, extent, depth))
    }

  }
  return lines
}

/**
 * generates the 100k Lines for the GZD Segment defined by gzd and band
 * @param {Number} gzd Horizontal GZD Number 1-60
 * @param {String} band Vertical GZD band 'C'-'X'
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const draw100kLines = (gzd, band) => {
  const lines = []
  const firsts = {}
  for (let second = 0; second < SQUAREIDENTIEFERS.length - 4; second++) {
    let lastValidPosition
    for (let first = 0; first < SQUAREIDENTIEFERS.length; first++) {
      const target = buildMgrsString(gzd, band, SQUAREIDENTIEFERS[first], SQUAREIDENTIEFERS[second], 0, 0)
      const newHLines = horizontal100kLines(target, lastValidPosition, lines)
      lines.push(...newHLines)
      const newVLines = vertical100kLines(target, firsts[SQUAREIDENTIEFERS[first]], lines)
      lines.push(...newVLines)
      lastValidPosition = newHLines.length > 0 ? fromMgrs(target) : lastValidPosition
      firsts[SQUAREIDENTIEFERS[first]] = lastValidPosition
    }
  }
  return lines
}

/**
 * generates the vertical 100k Line from the last valid Mgrs Coordinate within the Segment
 * @param {String} target target Mgrs Coordinate String (length=15)
 * @param {String} lastValidPosition ast valid Mgrs Coordinate String (length=15)
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const vertical100kLines = (target, lastValidPosition) => {
  const lines = []
  const first = target.substr(3, 1)
  if (lastValidPosition) {
    const controllMGRS = toMgrs(lastValidPosition)
    // new Grid segment
    if (controllMGRS.substr(3, 1) !== first) {
      return lines
    }
  }
  const line = drawGridLine(target, lastValidPosition, 0, first, false, 100000)
  if (line) {
    lines.push(line)
  }
  return lines
}

/**
 * generates the horizontal 100k Line from the last valid Mgrs Coordinate within the Segment
 * also generates the right GZD Connection with the last valid MGRS coordinate within the segment and the last possible coordinate
 * @param {String} target target Mgrs Coordinate String (length=15)
 * @param {String} lastValidPosition ast valid Mgrs Coordinate String (length=15)
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const horizontal100kLines = (target, lastValidPosition) => {
  const lines = []
  const line = drawGridLine(target, lastValidPosition, 0, target.substr(4, 1), true, 100000)
  if (line) {
    lines.push(line)
  }
  const newValidPosition = isValid100kSegment(target) ? fromMgrs(target) : lastValidPosition
  if (newValidPosition && target.substr(3, 1) === SQUAREIDENTIEFERS[SQUAREIDENTIEFERS.length - 1]) {
    const startPoint = getGzdPoint(newValidPosition, true)
    lines.push(createLine(fromLonLat([startPoint[0], newValidPosition[1]]), fromLonLat(newValidPosition), 2, target.substr(4, 1), loadedWrapBack))
  }
  return lines
}
/**
 * generates the detail Lines for the GZD Segment defined by gzd and band
 * Detail lines= {gzd}{band} {e100k}{n100k} {00001-99999} {00001-99999}
 * @param {Number} gzd Horizontal GZD Number 1-60
 * @param {String} band Vertical GZD band 'C'-'X'
 * @param {import('ol/extent').Extent} extent
 * @param {Number} depth detail level of the Grid
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const drawDetailLines = (gzd, band, extent, depth) => {
  const lines = []
  for (let y = 0; y < SQUAREIDENTIEFERS.length - 4; y++) {
    for (let x = 0; x < SQUAREIDENTIEFERS.length; x++) {
      const e100k = SQUAREIDENTIEFERS[x]
      const n100k = SQUAREIDENTIEFERS[y]
      const intersects = (easting, northing, step) => intersectsSegment(gzd, band, e100k, n100k, easting, northing, step, extent)
      if (intersects(0, 0, 99999)) {
        const mgrsBuilder = (easting, northing) => buildMgrsString(gzd, band, e100k, n100k, easting, northing)
        const horizontalLines = drawHorizontal(mgrsBuilder, intersects, depth)
        const verticalLines = drawVertical(mgrsBuilder, intersects, depth)
        lines.push(...horizontalLines, ...verticalLines)
      }
    }
  }
  return lines
}

/**
 * generates the Vertical Lines for the 100km segment defined by gzd, band, e100k, n100k
 * @param {Function} mgrsBuilder used to get the mgrs String for the current segment and the x/y coordinates
 * @param {Function} intersects used to get check if the current Segment and the current x/y coordinates are within the extent
 * @param {Number} depth detail level of the Grid
 * @param {Number} currentDepth detail level of the Recursion
 * @param {Number} sourceX the inital X
 * @param {Number} sourceY the inital Y
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const drawVertical = (mgrsBuilder, intersects, depth, currentDepth = 1, sourceX = 0, sourceY = 0) => {
  const lines = []
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let x = 0; x < 10; x++) {
    const newX = sourceX + (x * step)
    let lastValidPosition
    for (let y = 0; y <= 10 && (sourceY + (y * step)) <= 100000; y++) {
      const newY = sourceY + (y * step)
      if (currentDepth === depth) {
        const target = mgrsBuilder(newX, newY)
        const text = newX === 0 ? target.substr(3, 1) : getDetailText(newX, depth)
        const line = drawGridLine(target, lastValidPosition, depth, text, false, step)
        if (line) {
          lines.push(line)
        }
        if (lastValidPosition && !isValid100kSegment(target)) {
          // lastValidPosition was in segment and the next Position is Out of segment
          break
        }
        lastValidPosition = isValid100kSegment(target) ? fromMgrs(target) : lastValidPosition
      } else if (intersects(newX, newY, step)) {
        const newLines = drawVertical(mgrsBuilder, intersects, depth, currentDepth + 1, newX, newY)
        lines.push(...newLines)
      }
    }
  }
  return lines
}


/**
 * generates the Horizontal Lines for the 100km segment defined by gzd, band, e100k, n100k
 * @param {Function} mgrsBuilder used to get the mgrs String for the current segment and the x/y coordinates
 * @param {Function} intersects used to get check if the current Segment and the current x/y coordinates are within the extent
 * @param {Number} depth detail level of the Grid
 * @param {Number} currentDepth detail level of the Recursion
 * @param {Number} sourceX the inital X
 * @param {Number} sourceY the inital Y
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const drawHorizontal = (mgrsBuilder, intersects, depth, currentDepth = 1, sourceX = 0, sourceY = 0) => {
  const lines = []
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let y = 0; y < 10; y++) {
    const newY = sourceY + (y * step)
    let lastValidPosition
    for (let x = 0; x <= 10 && (sourceX + (x * step)) <= 100000; x++) {
      const newX = sourceX + (x * step)
      if (currentDepth === depth) {
        const target = mgrsBuilder(newX, newY)
        const text = newY === 0 ? target.substr(4, 1) : getDetailText(newY, depth)
        const line = drawGridLine(target, lastValidPosition, depth, text, true, step)
        if (line) {
          lines.push(line)
        }
        if (lastValidPosition && !isValid100kSegment(target)) {
          // lastValidPosition was in segment and the next Position is Out of segment
          break
        }
        lastValidPosition = isValid100kSegment(target) ? fromMgrs(target) : lastValidPosition
      } else if (intersects(newX, newY, step)) {
        const newLines = drawHorizontal(mgrsBuilder, intersects, depth, currentDepth + 1, newX, newY)
        lines.push(...newLines)
      }
    }
  }
  return lines
}

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
const intersectsSegment = (gzd, band, e100k, n100k, x, y, step, extent) => {
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

const getDetailText = (number, depth) => {
  const text = fromatDetailLevel(number)
  return text.substr(0, depth)
}

/**
 * generates a Line from the last valid Position to mgrs or to the gzd border
 * @param {String} mgrs MGRS string
 * @param {String} lastPosition MGRS string
 * @param {Number} depth detailLevel
 * @param {String} text LineString Text
 * @param {Boolean} isHorizontal says if the Line is Horizontal, needed for GZD Border calculations
 * @param {Number} step difference between the easting/northing (x/y) for each detail segment
 */
const drawGridLine = (mgrs, lastPosition, depth, text, isHorizontal, step) => {
  const lonlat = fromMgrs(mgrs)
  let visualDepth = depth + 2
  if (depth > 0 && ((isHorizontal && mgrs.substr(10, 5) === '00000') || (!isHorizontal && mgrs.substr(5, 5) === '00000'))) {
    visualDepth = depth
  }
  if (isValid100kSegment(mgrs)) {
    if (lastPosition) {
      return createLine(fromLonLat(lastPosition), fromLonLat(lonlat), visualDepth, text, loadedWrapBack)
    } else if (isHorizontal) {
      return leftGzdConnection(mgrs, step, visualDepth, depth, text)
    } else {
      return bottomGzdConnection(mgrs, step, visualDepth, depth, text)
    }
  } else if (!isHorizontal && lastPosition) {
    return topGzdConnection(mgrs, lastPosition, visualDepth, depth, text)
  } else if (isHorizontal && lastPosition && isValidBand(mgrs) && depth > 0) {
    return rightGzdConnection(lonlat, lastPosition, visualDepth, text)
  }
}

const bottomGzdConnection = (mgrs, step, visualDepth, depth, text) => {
  const lonlat = fromMgrs(mgrs)
  const startPoint = getGzdPoint([lonlat[0], lonlat[1]], false)
  if (depth > 0) {
    // thanks norway
    const nextNorthing = fromatDetailLevel(Number(mgrs.substr(10, 5)) + step)
    const assumedNextPoint = fromMgrs(mgrs.substr(0, 10) + nextNorthing)
    const controllMGRS = toMgrs([assumedNextPoint[0], lonlat[1] - (assumedNextPoint[1] - lonlat[1])])
    if (!isNaN(assumedNextPoint[0]) && !isValidGzdZone(controllMGRS, mgrs) && !isValidBand(controllMGRS, mgrs)) {
      return borderConnection(lonlat, assumedNextPoint, visualDepth, text, false, false)
    }
  } else {
    const newBand = getPrevious(mgrs.substr(2, 1))
    const newN100k = mgrs.substr(4, 1) === 'A' ? 'V' : getPrevious(mgrs.substr(4, 1))
    const newMGRS = mgrs.substr(0, 2) + newBand + mgrs.substr(3, 1) + newN100k + mgrs.substr(5, 10)
    const source = fromMgrs(newMGRS)
    const controllMGRS = toMgrs([source[0], source[1]])
    if (isValidGzdZone(controllMGRS, mgrs)) {
      return createLine(fromLonLat(fromMgrs(mgrs)), fromLonLat(source), 0, mgrs.substr(3, 1), loadedWrapBack)
    } else {
      // thanks norway
      const diff = source[0] - lonlat[0]
      const newLon = (diff * (startPoint[1] - lonlat[1]) / (source[1] - lonlat[1])) + lonlat[0]
      return createLine(fromLonLat(fromMgrs(mgrs)), fromLonLat([newLon, startPoint[1]]), 0, mgrs.substr(3, 1), loadedWrapBack)
    }
  }
}

const leftGzdConnection = (mgrs, step, visualDepth, depth, text) => {
  const lonlat = fromMgrs(mgrs)
  if (depth > 0) {
    const nextEasting = fromatDetailLevel(Number(mgrs.substr(5, 5)) + step)
    const assumedNextPoint = fromMgrs(mgrs.substr(0, 5) + nextEasting + mgrs.substr(10, 5))
    const startPoint = getGzdPoint([lonlat[0], lonlat[1]], false)
    if ((!isNaN(assumedNextPoint[0]) && lonlat[0] - (assumedNextPoint[0] - lonlat[0]) < startPoint[0])) {
      return borderConnection(lonlat, assumedNextPoint, visualDepth, text, false, true)
    }

  } else {
    const startPoint = getGzdPoint([lonlat[0], lonlat[1]], false)
    return createLine(fromLonLat([startPoint[0], lonlat[1]]), fromLonLat([lonlat[0], lonlat[1]]), visualDepth, text, loadedWrapBack)
  }
}

const rightGzdConnection = (lonlat, lastPosition, visualDepth, text) => {
  return borderConnection(lastPosition, lonlat, visualDepth, text, true, true)
}

const topGzdConnection = (mgrs, lastPosition, visualDepth, depth, text) => {
  const lonlat = fromMgrs(mgrs)
  if (depth > 0 && lastPosition && isValidGzdZone(mgrs)) {
    return createLine(fromLonLat(lastPosition), fromLonLat([lonlat[0], lonlat[1]]), visualDepth, text, loadedWrapBack)
  } else if (lastPosition && !isValidGzdZone(mgrs) && !isValidBand(mgrs)) {
    // thanks norway
    return borderConnection(lastPosition, lonlat, visualDepth, text, true, false)
  }
}

const borderConnection = (sourceLonLat, nextPointLonLat, depth, text, isEndPoint, isHorizontal) => {
  const endPoint = getGzdPoint([sourceLonLat[0], sourceLonLat[1]], isEndPoint)
  if (isHorizontal) {
    const diff = nextPointLonLat[1] - sourceLonLat[1]
    const newLat = diff * (endPoint[0] - sourceLonLat[0]) / (nextPointLonLat[0] - sourceLonLat[0]) + sourceLonLat[1]
    return createLine(fromLonLat([endPoint[0], newLat]), fromLonLat([sourceLonLat[0], sourceLonLat[1]]), depth, text, loadedWrapBack)
  } else {
    const diff = nextPointLonLat[0] - sourceLonLat[0]
    const newLon = (diff * (endPoint[1] - sourceLonLat[1]) / (nextPointLonLat[1] - sourceLonLat[1])) + sourceLonLat[0]
    return createLine(fromLonLat([newLon, endPoint[1]]), fromLonLat([sourceLonLat[0], sourceLonLat[1]]), depth, text, loadedWrapBack)
  }
}

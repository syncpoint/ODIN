import { fromLonLat } from 'ol/proj'
import { getGzdPoint } from './gzdZones'
import { loopGZD, loopE100k, loopN100k, loop100k, loopNumericalSegments } from './segmentLoops'
import { fromMgrs, toMgrs, buildMgrsString, fromatDetailLevel, getPrevious, addStep } from './mgrs'
import { intersectsSegment, isValid100kSegment, isValidGzdZone, isValidBand, isValidGzdSegment } from './validation'
import { createLine, wrapX, splitWorlds } from '../utils'
import { equals } from 'ol/extent'


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
  // check if extent is already loaded
  if (loadedExtent && equals(extent, loadedExtent)) {
    return
  }
  loadedExtent = extent

  const extents = splitWorlds(extent, projection)
  const lines = []
  extents.forEach(extent => {
    const { e, f } = wrapX(extent, projection)
    loadedWrapBack = f
    lines.push(...buildLines(e, depth))

  })
  return lines
}

/**
 * generates Mgrs grid (not including gzd Zones)
 * @param {import('ol/extent').Extent} extent extent within the initial world
 * @param {Number} depth detail level of the Grid
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const buildLines = (extent, depth) => {
  const lineGenerator = depth === 0 ? generate100kLines : generateDetailLines
  const lines = []
  loopGZD(extent, (gzd, band) => {
    lines.push(...lineGenerator(gzd, band, extent, depth))
  })
  return lines
}

/**
 * generates the 100k Lines for the GZD Segment defined by gzd and band
 * @param {Number} gzd Horizontal GZD Number 1-60
 * @param {String} band Vertical GZD band 'C'-'X'
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const generate100kLines = (gzd, band) => {
  const lines = []
  const drawLine = (position, isHorizontal) => drawGridLine(position, 0, isHorizontal, 100000)
  // stores the last valid e100ks, so it can be used as startPoint in the next n100k Segment
  loopN100k(n100k => {
    loopE100k(e100k => {
      const startMgrs = buildMgrsString(gzd, band, e100k, n100k, 0, 0)

      const horizontalLine = drawLine(startMgrs, false)
      if (horizontalLine) {
        lines.push(horizontalLine)
      }

      const verticalLine = drawLine(startMgrs, true)
      if (verticalLine) {
        lines.push(verticalLine)
      }

    })
  })
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
const generateDetailLines = (gzd, band, extent, depth) => {
  const lines = []
  loop100k((e100k, n100k) => {
    const intersects = (easting, northing, step) => intersectsSegment(gzd, band, e100k, n100k, easting, northing, step, extent)
    if (intersects(0, 0, 99999)) {
      const mgrsBuilder = (easting, northing) => buildMgrsString(gzd, band, e100k, n100k, easting, northing)
      const detailLines = numericLines(mgrsBuilder, intersects, depth)
      lines.push(...detailLines)
    }
  })
  return lines
}

/**
 * generates the Lines for a Segment depending on the detail level
 * loops through the segments below 100k segments,
 * if they are intersect with the view they will eigther generate more detailed segments
 * or draw the lines within the segment, depending on the depth and the recursion depth
 * @param {Function} mgrsBuilder used to get the mgrs String for the current segment and the x/y coordinates
 * @param {Function} intersects used to check if the current easting/norting Segment is within the extent
 * @param {Number} depth detail level of the Grid
 * @param {Number} currentDepth detail level of the Recursion
 * @param {Number} parentEasting easting of the parent segment
 * @param {Number} parentNorthing northing of the parent segment
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const numericLines = (mgrsBuilder, intersects, depth, currentDepth = 1, parentEasting = 0, parentNorthing = 0) => {
  const lines = []
  // the step gets lower with the recursion depth, initialy 10000
  const step = 10000 / Math.pow(10, currentDepth - 1)

  const drawLine = (position, isHorizontal) => drawGridLine(position, currentDepth, isHorizontal, step)
  loopNumericalSegments(step, parentNorthing, (northing) => {
    loopNumericalSegments(step, parentEasting, (easting) => {
      if (currentDepth === depth) {
        const startMGRS = mgrsBuilder(easting, northing)
        const hLine = drawLine(startMGRS, true)
        if (hLine) {
          lines.push(hLine)
        }

        const vLine = drawLine(startMGRS, false)
        if (vLine) {
          lines.push(vLine)
        }
      } else if (intersects(easting, northing, step)) {
        const newLines = numericLines(mgrsBuilder, intersects, depth, currentDepth + 1, easting, northing)
        lines.push(...newLines)
      }
    })
  })
  return lines
}

/**
 * generates a ol/Linestring from the last valid Position to mgrs or to the gzd border connections
 * @param {String} startMgrs startPoint
 * @param {Number} depth detailLevel
 * @param {Boolean} isHorizontal says if the Line is Horizontal, needed for GZD Border calculations
 * @param {Number} step difference between the easting/northing (x/y) for each detail segment
 */
const drawGridLine = (startMgrs, depth, isHorizontal, step) => {
  const validStart = isValid100kSegment(startMgrs) ? fromMgrs(startMgrs) : undefined
  const target = addStep(startMgrs, isHorizontal, step)
  const lonlat = fromMgrs(target)
  let visualDepth = depth + 2
  if (depth > 0 && ((isHorizontal && startMgrs.substr(10, 5) === '00000') || (!isHorizontal && startMgrs.substr(5, 5) === '00000'))) {
    visualDepth = depth
  }
  if (isValid100kSegment(target)) {
    if (validStart) {
      return createLine(fromLonLat(validStart), fromLonLat(lonlat), visualDepth, loadedWrapBack)
    } else if (isHorizontal) {
      return leftGzdConnection(target, fromMgrs(startMgrs), step, visualDepth)
    } else {
      return bottomGzdConnection(target, step, visualDepth, depth)
    }
  } else if (!isHorizontal && validStart) {
    return topGzdConnection(target, validStart, visualDepth, depth)
  } else if (isHorizontal && validStart) {
    return rightGzdConnection(target, validStart, visualDepth)
  }
}

const bottomGzdConnection = (mgrs, step, visualDepth, depth) => {
  const lonlat = fromMgrs(mgrs)
  const startPoint = getGzdPoint([lonlat[0], lonlat[1]], false)
  if (depth > 0) {
    // thanks norway
    const nextNorthing = fromatDetailLevel(Number(mgrs.substr(10, 5)) + step)
    const assumedNextPoint = fromMgrs(mgrs.substr(0, 10) + nextNorthing)
    const controllMGRS = toMgrs([assumedNextPoint[0], lonlat[1] - (assumedNextPoint[1] - lonlat[1])])
    if (!isNaN(assumedNextPoint[0]) && !isValidGzdZone(controllMGRS, mgrs) && !isValidBand(controllMGRS, mgrs)) {
      return borderConnection(lonlat, assumedNextPoint, visualDepth, false, false)
    }
  } else {
    const newBand = getPrevious(mgrs.substr(2, 1))
    const newN100k = mgrs.substr(4, 1) === 'A' ? 'V' : getPrevious(mgrs.substr(4, 1))
    const newMGRS = mgrs.substr(0, 2) + newBand + mgrs.substr(3, 1) + newN100k + mgrs.substr(5, 10)
    const source = fromMgrs(newMGRS)
    const controllMGRS = toMgrs([source[0], source[1]])
    if (isValidGzdZone(controllMGRS, mgrs)) {
      return createLine(fromLonLat(fromMgrs(mgrs)), fromLonLat(source), 0, loadedWrapBack)
    } else {
      // thanks norway
      const diff = source[0] - lonlat[0]
      const newLon = (diff * (startPoint[1] - lonlat[1]) / (source[1] - lonlat[1])) + lonlat[0]
      const target = [newLon, startPoint[1]]
      if (isValidGzdSegment(mgrs, toMgrs(target))) {
        return createLine(fromLonLat(fromMgrs(mgrs)), fromLonLat(target), 0, loadedWrapBack)
      }
    }
  }
}

const leftGzdConnection = (mgrs, lastPosition, step, visualDepth) => {
  return borderConnection(fromMgrs(mgrs), lastPosition, visualDepth, false, true)
}

const rightGzdConnection = (mgrs, lastPosition, visualDepth) => {
  return borderConnection(lastPosition, fromMgrs(mgrs), visualDepth, true, true)
}

const topGzdConnection = (mgrs, lastPosition, visualDepth, depth) => {
  const lonlat = fromMgrs(mgrs)
  if (depth > 0 && lastPosition && isValidGzdZone(mgrs)) {
    return createLine(fromLonLat(lastPosition), fromLonLat([lonlat[0], lonlat[1]]), visualDepth, loadedWrapBack)
  } else if (lastPosition && !isValidGzdZone(mgrs) && !isValidBand(mgrs)) {
    // thanks norway
    return borderConnection(lastPosition, lonlat, visualDepth, true, false)
  }
}

const borderConnection = (sourceLonLat, nextPointLonLat, depth, isEndPoint, isHorizontal) => {
  const endPoint = getGzdPoint([sourceLonLat[0], sourceLonLat[1]], isEndPoint)
  if (isHorizontal) {
    const diff = nextPointLonLat[1] - sourceLonLat[1]
    const newLat = diff * (endPoint[0] - sourceLonLat[0]) / (nextPointLonLat[0] - sourceLonLat[0]) + sourceLonLat[1]
    return createLine(fromLonLat([endPoint[0], newLat]), fromLonLat([sourceLonLat[0], sourceLonLat[1]]), depth, loadedWrapBack)
  } else {
    const diff = nextPointLonLat[0] - sourceLonLat[0]
    const newLon = (diff * (endPoint[1] - sourceLonLat[1]) / (nextPointLonLat[1] - sourceLonLat[1])) + sourceLonLat[0]
    return createLine(fromLonLat([newLon, endPoint[1]]), fromLonLat([sourceLonLat[0], sourceLonLat[1]]), depth, loadedWrapBack)
  }
}

import { fromLonLat } from 'ol/proj'
import { getGzdPoint } from './gzdZones'
import { loopGZD, loopE100k, loopN100k, loop100k } from './segmentLoops'
import { SEGMENTIDENTIEFERS, fromMgrs, toMgrs, buildMgrsString, fromatDetailLevel, getPrevious } from './mgrs'
import { intersectsSegment, isValid100kSegment, isValidGzdZone, isValidBand } from './validation'
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
  // stores the last valid e100ks, so it can be used as startPoint in the next n100k Segment
  const lastValidE100ks = {}
  loopN100k(n100k => {
    let lastValidPosition
    loopE100k(e100k => {
      const target = buildMgrsString(gzd, band, e100k, n100k, 0, 0)

      const horizontalLine = horizontal100kLine(target, lastValidPosition, lines)
      if (horizontalLine) {
        lines.push(horizontalLine)
      }

      const verticalLine = vertical100kLine(target, lastValidE100ks[e100k], lines)
      if (verticalLine) {
        lines.push(verticalLine)
      }

      lastValidPosition = horizontalLine ? fromMgrs(target) : lastValidPosition
      lastValidE100ks[e100k] = lastValidPosition
    })
  })
  return lines
}

/**
 * generates the vertical 100k Line from the last valid Mgrs Coordinate within the Segment
 * @param {String} target target Mgrs Coordinate String (length=15)
 * @param {[Number,Number]} lastValidPosition startPoint [Lon,Lat]
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const vertical100kLine = (target, lastValidPosition) => {
  const first = target.substr(3, 1)
  if (lastValidPosition) {
    const controllMGRS = toMgrs(lastValidPosition)
    if (controllMGRS.substr(3, 1) !== first) {
      // new Grid segment
      return
    }
  }
  return drawGridLine(target, lastValidPosition, 0, first, false, 100000)
}

/**
 * generates the horizontal 100k Line from the last valid Mgrs Coordinate within the Segment
 * also generates the right GZD Connection with the last valid MGRS coordinate within the segment and the last possible coordinate
 * @param {String} target target Mgrs Coordinate String (length=15)
 * @param {[Number,Number]} lastValidPosition startPoint [Lon,Lat]
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const horizontal100kLine = (target, lastValidPosition) => {
  return drawGridLine(target, lastValidPosition, 0, target.substr(4, 1), true, 100000)
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
      const horizontalLines = horizontalNumericLines(mgrsBuilder, intersects, depth)
      const verticalLines = verticalNumericLines(mgrsBuilder, intersects, depth)
      lines.push(...horizontalLines, ...verticalLines)
    }
  })
  return lines
}

/**
 * generates the VerticalLines for a Segment
 * loops mgrs northing and easting coordinates, at the first detail level with 10.000 steps, to calculate the sub Segments or draw the lines
 * recursion level reduces the step to step/10 so the next detail level is 1 000
 * @param {Function} mgrsBuilder used to get the mgrs String for the current segment and the x/y coordinates
 * @param {Function} intersects used to check if the current easting/norting Segment is within the extent
 * @param {Number} depth detail level of the Grid
 * @param {Number} currentDepth detail level of the Recursion
 * @param {Number} parentEasting easting of the parent segment
 * @param {Number} parentNorthing northing of the parent segment
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const verticalNumericLines = (mgrsBuilder, intersects, depth, currentDepth = 1, parentEasting = 0, parentNorthing = 0) => {
  const lines = []
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let segmentEasting = 0; segmentEasting < 10; segmentEasting++) {
    let lastValidPosition
    const easting = parentEasting + (segmentEasting * step)
    for (let segmentNorthing = 0; segmentNorthing <= 10; segmentNorthing++) {
      const northing = parentNorthing + (segmentNorthing * step)
      if (northing <= 100000) {
        if (currentDepth === depth) {
          const target = mgrsBuilder(easting, northing)
          const text = easting === 0 ? target.substr(3, 1) : mgrsNumericText(easting, depth)
          const line = drawGridLine(target, lastValidPosition, depth, text, false, step)
          if (line) {
            lines.push(line)
          }
          if (lastValidPosition && !isValid100kSegment(target)) {
            break
          }
          lastValidPosition = isValid100kSegment(target) ? fromMgrs(target) : lastValidPosition
        } else if (intersects(easting, northing, step)) {
          const newLines = verticalNumericLines(mgrsBuilder, intersects, depth, currentDepth + 1, easting, northing)
          lines.push(...newLines)
        }
      }
    }
  }
  return lines
}


/**
 * generates the Horizontal Lines for a Segment defined by gzd, band, e100k, n100k,easting and northing
 * loops trough mgrs northing and easting coordinates, at the first detail level with 10.000 steps
 * recursion level reduces the step to step/10 so the next detail level is 1 000
 * @param {Function} mgrsBuilder used to get the mgrs String for the current segment and the x/y coordinates
 * @param {Function} intersects used to check if the current easting/norting Segment is within the extent
 * @param {Number} depth detail level of the Grid
 * @param {Number} currentDepth detail level of the Recursion
 * @param {Number} parentEasting easting of the parent segment
 * @param {Number} parentNorthing northing of the parent segment
 * @returns {import("ol/Feature")[]} Array of ol/Feature
 */
const horizontalNumericLines = (mgrsBuilder, intersects, depth, currentDepth = 1, parentEasting = 0, parentNorthing = 0) => {
  const lines = []
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let segmentNorthing = 0; segmentNorthing < 10; segmentNorthing++) {
    const northing = parentNorthing + (segmentNorthing * step)
    let lastValidPosition
    for (let segmentEasting = 0; segmentEasting <= 10; segmentEasting++) {
      const easting = parentEasting + (segmentEasting * step)
      if (easting <= 100000) {
        if (currentDepth === depth) {
          const target = mgrsBuilder(easting, northing)
          const text = northing === 0 ? target.substr(4, 1) : mgrsNumericText(northing, depth)
          const line = drawGridLine(target, lastValidPosition, depth, text, true, step)
          if (line) {
            lines.push(line)
          }
          if (lastValidPosition && !isValid100kSegment(target)) {
            break
          }
          lastValidPosition = isValid100kSegment(target) ? fromMgrs(target) : lastValidPosition
        } else if (intersects(easting, northing, step)) {
          const newLines = horizontalNumericLines(mgrsBuilder, intersects, depth, currentDepth + 1, easting, northing)
          lines.push(...newLines)
        }
      }
    }
  }
  return lines
}
/**
 * Formats number to a MGRS easting/northing String with the accuracy of 5
 * and returns the substring according to its depth
 * @param {Number} number
 * @param {Number} depth
 */
const mgrsNumericText = (number, depth) => {
  const text = fromatDetailLevel(number)
  return text.substr(0, depth)
}

/**
 * generates a ol/Linestring from the last valid Position to mgrs or to the gzd border connections
 * @param {String} mgrs MGRS string
 * @param {[Number,Number]} lastPosition startPoint [Lon,Lat]
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
  } else if (isHorizontal && lastPosition) {
    return rightGzdConnection(mgrs, lastPosition, visualDepth, depth, text)
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

const rightGzdConnection = (mgrs, lastPosition, visualDepth, depth, text) => {
  const lonlat = fromMgrs(mgrs)
  if (depth > 0) {
    return borderConnection(lastPosition, lonlat, visualDepth, text, true, true)
  } else if (mgrs.substr(3, 1) === SEGMENTIDENTIEFERS[SEGMENTIDENTIEFERS.length - 1]) {
    const newValidPosition = isValid100kSegment(mgrs) ? fromMgrs(mgrs) : lastPosition
    const startPoint = getGzdPoint(newValidPosition, true)
    return createLine(fromLonLat([startPoint[0], newValidPosition[1]]), fromLonLat(newValidPosition), 2, mgrs.substr(4, 1), loadedWrapBack)
  }
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

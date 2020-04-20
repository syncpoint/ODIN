import { fromLonLat, toLonLat } from 'ol/proj'
import coordinateFormat from '../../../../shared/coord-format'
import { createLine, wrapX, splitWorlds } from '../utils'
import { fromMgrs, toMgrs, buildMgrsString, fromatDetailLevel, getPrevious, isValidSegment } from './mgrs'
import { getGzdPoint } from './gzdZones'
import { boundingExtent, intersects, equals } from 'ol/extent'

const SQUAREIDENTIEFERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

var loadedExtent
var loadedWrapBack
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

const buildLines = (extent, depth) => {
  const lines = []
  const startPoint = toLonLat([extent[0], extent[1]])
  const endPoint = toLonLat([extent[2], extent[3]])
  const boottomLeftMGRS = coordinateFormat.format({ lng: startPoint[0], lat: startPoint[1] }).replace(' ', '')
  const topRightMGRS = coordinateFormat.format({ lng: endPoint[0], lat: endPoint[1] }).replace(' ', '')
  const boottomRightMGRS = coordinateFormat.format({ lng: endPoint[0], lat: startPoint[1] }).replace(' ', '')
  const topLeftMGRS = coordinateFormat.format({ lng: startPoint[0], lat: endPoint[1] }).replace(' ', '')
  const startxGZD = Math.min(boottomLeftMGRS.substr(0, 2), topLeftMGRS.substr(0, 2))
  const endxGZD = Math.max(topRightMGRS.substr(0, 2), boottomRightMGRS.substr(0, 2))
  for (let xGZD = startxGZD; xGZD <= endxGZD; xGZD++) {
    for (let ySegment = Number(boottomLeftMGRS.charCodeAt(2)); ySegment <= Number(topRightMGRS.charCodeAt(2)); ySegment++) {
      const lineGenerator = depth === 0 ? draw100kLines : drawDetailLines
      lines.push(...lineGenerator(xGZD, String.fromCharCode(ySegment), extent, depth))
    }

  }
  return lines
}

const draw100kLines = (xGZD, band) => {
  const lines = []
  const firsts = {}
  for (let second = 0; second < SQUAREIDENTIEFERS.length; second++) {
    let lastValidPosition
    for (let first = 0; first < SQUAREIDENTIEFERS.length; first++) {
      try {
        const target = buildMgrsString(xGZD, band, SQUAREIDENTIEFERS[first], SQUAREIDENTIEFERS[second], 0, 0)
        const newHLines = horizontal100kLines(target, lastValidPosition, lines)
        lines.push(...newHLines)
        const newVLines = vertical100kLines(target, firsts[SQUAREIDENTIEFERS[first]], lines)
        lines.push(...newVLines)
        lastValidPosition = newHLines.length > 0 ? fromMgrs(target) : lastValidPosition
        firsts[SQUAREIDENTIEFERS[first]] = lastValidPosition
      } catch (err) {
        // out of segment
        break
      }
    }
  }
  return lines
}

const vertical100kLines = (target, lastValidPosition) => {
  const lines = []
  const first = target.substr(3, 1)
  if (lastValidPosition) {
    const controllMGRS = toMgrs(lastValidPosition, 5)
    // new Grid segment and rounding error
    if (controllMGRS.substr(3, 1) === first || controllMGRS.substr(10, 5) > 99999) {
      const line = drawGridLine(target, lastValidPosition, 0, first, false, 100000)
      if (line) {
        lines.push(line)
      }
    }
  } else {
    const line = drawGridLine(target, undefined, 0, first, false, 100000)
    if (line) {
      lines.push(line)
    }
  }
  return lines
}

const horizontal100kLines = (target, lastValidPosition) => {
  const lines = []
  const line = drawGridLine(target, lastValidPosition, 0, target.substr(4, 1), true, 100000)
  if (line) {
    lines.push(line)
  }
  const newValidPosition = isValidSegment(target) ? fromMgrs(target) : lastValidPosition
  if (target.substr(3, 1) === SQUAREIDENTIEFERS[SQUAREIDENTIEFERS.length - 1]) {
    const startPoint = getGzdPoint(newValidPosition, true)
    lines.push(createLine(fromLonLat([startPoint[0], newValidPosition[1]]), fromLonLat(newValidPosition), 2, target.substr(4, 1), loadedWrapBack))
  }
  return lines
}

const drawDetailLines = (xGZD, band, extent, depth) => {
  const lines = []
  for (let second = 0; second < SQUAREIDENTIEFERS.length; second++) {
    for (let first = 0; first < SQUAREIDENTIEFERS.length; first++) {
      if (calcMinRenderArea(xGZD, band, SQUAREIDENTIEFERS[first], SQUAREIDENTIEFERS[second], 0, 0, 99999, extent)) {
        const horizontalLines = drawHorizontal(xGZD, band, SQUAREIDENTIEFERS[first], SQUAREIDENTIEFERS[second], depth, 1, 0, 0, extent)
        const verticalLines = drawVertical(xGZD, band, SQUAREIDENTIEFERS[first], SQUAREIDENTIEFERS[second], depth, 1, 0, 0, extent)
        lines.push(...horizontalLines, ...verticalLines)
      }
    }
  }
  return lines
}
const drawVertical = (xGZD, band, first, second, depth, currentDepth, sourceX, sourceY, extent) => {
  const lines = []
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let x = 0; x < 10; x++) {
    const newX = sourceX + (x * step)
    let lastValidPosition
    for (let y = 0; y <= 10; y++) {
      const newY = sourceY + (y * step)
      try {
        if (currentDepth === depth) {
          const target = buildMgrsString(xGZD, band, first, second, newX, newY)
          const text = getDetailText(newX, first, depth)
          const line = drawGridLine(target, lastValidPosition, depth, text, false, step)
          if (line) {
            lines.push(line)
          }
          lastValidPosition = isValidSegment(target) ? fromMgrs(target) : lastValidPosition
        } else if (calcMinRenderArea(xGZD, band, first, second, newX, newY, step, extent)) {
          const newLines = drawVertical(xGZD, band, first, second, depth, currentDepth + 1, newX, newY, extent)
          lines.push(...newLines)
        }
      } catch (error) {
        // Out of segment
        break
      }
    }
  }
  return lines
}

const drawHorizontal = (xGZD, band, first, second, depth, currentDepth, sourceX, sourceY, extent) => {
  const lines = []
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let y = 0; y < 10; y++) {
    const newY = sourceY + (y * step)
    let lastValidPosition
    for (let x = 0; x <= 10; x++) {
      const newX = sourceX + (x * step)
      try {
        if (currentDepth === depth) {
          const target = buildMgrsString(xGZD, band, first, second, newX, newY)
          const text = getDetailText(newY, second, depth)
          const line = drawGridLine(target, lastValidPosition, depth, text, true, step)
          if (line) {
            lines.push(line)
          }
          lastValidPosition = isValidSegment(target) ? fromMgrs(target) : lastValidPosition
        } else if (calcMinRenderArea(xGZD, band, first, second, newX, newY, step, extent)) {
          const newLines = drawHorizontal(xGZD, band, first, second, depth, currentDepth + 1, newX, newY, extent)
          lines.push(...newLines)
        }
      } catch (error) {
        // Out of segment
        break
      }
    }
  }
  return lines
}

/**
 * Should calculate if extent is within the Segment or if the Segment is within the extent
 * @param {*} xGZD MGRS argument for zone
 * @param {*} segment  MGRS argument for band
 * @param {*} first  MGRS argument for e100k
 * @param {*} second  MGRS argument for n100k
 * @param {*} x  MGRS argument for easting
 * @param {*} y  MGRS argument for northing
 * @param {*} steps step for easting and northing ( for 10 km Grid it is 10000)
 * @param {*} min LatLon min Extent
 * @param {*} max LatLon max Extent
 */
const calcMinRenderArea = (xGZD, segment, first, second, x, y, step, extent) => {
  try {
    const segmentBottomLeft = fromMgrs(buildMgrsString(xGZD, segment, first, second, x, y))
    const segmentBottomRight = fromMgrs(buildMgrsString(xGZD, segment, first, second, x + step, y))
    const segmentTopLeft = fromMgrs(buildMgrsString(xGZD, segment, first, second, x, y + step))
    const segmentTopRight = fromMgrs(buildMgrsString(xGZD, segment, first, second, x + step, y + step))
    const segmentExtent = boundingExtent([
      fromLonLat([segmentBottomLeft[0], segmentBottomLeft[1]]),
      fromLonLat([segmentBottomRight[0], segmentBottomRight[1]]),
      fromLonLat([segmentTopLeft[0], segmentTopLeft[1]]),
      fromLonLat([segmentTopRight[0], segmentTopRight[1]])
    ])

    return intersects(extent, segmentExtent)
  } catch (error) {
    // out of segment MGRS
    return false
  }
}


const getDetailText = (number, parentBorderText, depth) => {
  if (number === 0) {
    return parentBorderText
  }
  let text = `${number}`
  while (text.length < 5) {
    text = '0' + text
  }
  return text.substr(0, depth)

}

const drawGridLine = (mgrs, lastPosition, depth, text, isHorizontal, step) => {
  const lonlat = fromMgrs(mgrs)
  const controllMGRS = toMgrs([lonlat[0], lonlat[1]], 5)
  let visualDepth = depth + 2
  if (depth > 0 && ((isHorizontal && mgrs.substr(10, 5) === '00000') || (!isHorizontal && mgrs.substr(5, 5) === '00000'))) {
    visualDepth = depth
  }
  if (isValidSegment(mgrs)) {
    if (lastPosition) {
      return createLine(fromLonLat(lastPosition), fromLonLat(lonlat), visualDepth, text, loadedWrapBack)
    } else if (isHorizontal) {
      return leftGzdConnection(mgrs, step, visualDepth, depth, text)
    } else {
      return bottomGzdConnection(mgrs, step, visualDepth, depth, text)
    }
  } else if (!isHorizontal && lastPosition) {
    return topGzdConnection(mgrs, lastPosition, visualDepth, depth, text)
  } else if (isHorizontal && lastPosition && controllMGRS.substr(2, 1) === mgrs.substr(2, 1) && depth > 0) {
    return rightGzdConnection(lonlat, lastPosition, visualDepth, text)
  }
}

const bottomGzdConnection = (mgrs, step, visualDepth, depth, text) => {
  try {
    const lonlat = fromMgrs(mgrs)
    const startPoint = getGzdPoint([lonlat[0], lonlat[1]], false)
    if (depth > 0) {
      // thanks norway
      const nextNorthing = fromatDetailLevel(Number(mgrs.substr(10, 5)) + step)
      const assumedNextPoint = fromMgrs(mgrs.substr(0, 10) + nextNorthing)
      const controllMGRS = toMgrs([assumedNextPoint[0], lonlat[1] - (assumedNextPoint[1] - lonlat[1])], 5)
      if (!isNaN(assumedNextPoint[0]) && controllMGRS.substr(0, 2) !== mgrs.substr(0, 2) && controllMGRS.substr(2, 1) !== mgrs.substr(2, 1)) {
        return borderConnection(lonlat, assumedNextPoint, visualDepth, text, false, false)
      }
    } else {
      const newBand = getPrevious(mgrs.substr(2, 1))
      const newN100k = mgrs.substr(4, 1) === 'A' ? 'V' : getPrevious(mgrs.substr(4, 1))
      const newMGRS = mgrs.substr(0, 2) + newBand + mgrs.substr(3, 1) + newN100k + mgrs.substr(5, 10)
      const source = fromMgrs(newMGRS)
      const controllMGRS = toMgrs([source[0], source[1]], 5)
      if (controllMGRS.substr(0, 2) === mgrs.substr(0, 2)) {
        return createLine(fromLonLat(fromMgrs(mgrs)), fromLonLat(source), 0, mgrs.substr(3, 1), loadedWrapBack)
      } else {
        // thanks norway
        const diff = source[0] - lonlat[0]
        const newLon = (diff * (startPoint[1] - lonlat[1]) / (source[1] - lonlat[1])) + lonlat[0]
        return createLine(fromLonLat(fromMgrs(mgrs)), fromLonLat([newLon, startPoint[1]]), 0, mgrs.substr(3, 1), loadedWrapBack)
      }
    }
  } catch (error) {
    console.error('bottom GZD Border Connection shouldnt throw:' + error)
  }
}

const leftGzdConnection = (mgrs, step, visualDepth, depth, text) => {
  try {
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
  } catch (error) {
    console.error('leftGzdConnection shouldnt throw:' + error)
  }
}

const rightGzdConnection = (lonlat, lastPosition, visualDepth, text) => {
  try {
    return borderConnection(lastPosition, lonlat, visualDepth, text, true, true)
  } catch (error) {
    console.error('rightGzdConnection shouldnt throw:' + error)
  }
}

const topGzdConnection = (mgrs, lastPosition, visualDepth, depth, text) => {
  try {
    const lonlat = fromMgrs(mgrs)
    const controllMGRS = toMgrs([lonlat[0], lonlat[1]], 5)
    if (depth > 0 && lastPosition && controllMGRS.substr(0, 2) === mgrs.substr(0, 2)) {
      return createLine(fromLonLat(lastPosition), fromLonLat([lonlat[0], lonlat[1]]), visualDepth, text, loadedWrapBack)
    } else if (lastPosition && controllMGRS.substr(0, 2) !== mgrs.substr(0, 2) && controllMGRS.substr(2, 1) !== mgrs.substr(2, 1)) {
      // thanks norway
      return borderConnection(lastPosition, lonlat, visualDepth, text, true, false)
    }
  } catch (error) {
    console.error('topGzdConnection shouldnt throw:' + error)
  }
}

const borderConnection = (sourceLonLat, nextPointLonLat, depth, text, isEndPoint, isHorizontal) => {
  try {
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
  } catch (error) {
    console.error('couldnt connect GZD Segments:' + error)
  }
}

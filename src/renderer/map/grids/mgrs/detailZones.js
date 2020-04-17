import { fromLonLat, toLonLat } from 'ol/proj'
import coordinateFormat from '../../../../shared/coord-format'
import { fromMgrs, toMgrs, buildMgrsString, fromatDetailLevel, createLine, wrapX, splitWorlds } from '../utils'
import { getGzdPoint } from './gzdZones'
import { boundingExtent, intersects, equals } from 'ol/extent'

const SQUAREIDENTIEFERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

let loadedExtent
let loadedWrapBack
export const getDetailGrid = async (extent, projection, depth, callback) => {
  if (loadedExtent && equals(extent, loadedExtent)) {
    return
  }
  loadedExtent = extent
  const extents = splitWorlds(extent, projection)
  const lines = []
  for (let i = 0; i < extents.length; i++) {
    const newLines = await buildLines(extents[i], projection, depth)
    lines.push(...newLines)
  }
  callback(lines)
}

const buildLines = async (extent, projection, depth) => {
  let newExtent
  try {
    const { e, f } = wrapX([...extent], projection)
    newExtent = e
    loadedWrapBack = f
  } catch (error) {
    console.error('error with wrapping extent' + error)
  }
  const lines = []
  const startPoint = toLonLat([newExtent[0], newExtent[1]])
  const endPoint = toLonLat([newExtent[2], newExtent[3]])
  const boottomLeftMGRS = coordinateFormat.format({ lng: startPoint[0], lat: startPoint[1] }).replace(' ', '')
  const topRightMGRS = coordinateFormat.format({ lng: endPoint[0], lat: endPoint[1] }).replace(' ', '')
  const boottomRightMGRS = coordinateFormat.format({ lng: endPoint[0], lat: startPoint[1] }).replace(' ', '')
  const topLeftMGRS = coordinateFormat.format({ lng: startPoint[0], lat: endPoint[1] }).replace(' ', '')
  const startxGZD = Math.min(boottomLeftMGRS.substr(0, 2), topLeftMGRS.substr(0, 2))
  const endxGZD = Math.max(topRightMGRS.substr(0, 2), boottomRightMGRS.substr(0, 2))
  for (let xGZD = startxGZD; xGZD <= endxGZD; xGZD++) {
    for (let ySegment = Number(boottomLeftMGRS.charCodeAt(2)); ySegment <= Number(topRightMGRS.charCodeAt(2)); ySegment++) {
      switch (depth) {
        case 0: {
          draw100kLines(xGZD, ySegment, newExtent, lines)
          break
        }
        default: {
          const band = String.fromCharCode(ySegment)
          for (let second = 0; second < SQUAREIDENTIEFERS.length; second++) {
            for (let first = 0; first < SQUAREIDENTIEFERS.length; first++) {
              try {
                if (calcMinRenderArea(xGZD, band, SQUAREIDENTIEFERS[first], SQUAREIDENTIEFERS[second], 0, 0, 99999, newExtent)) {
                  const horizontalLines = await drawHorizontal(xGZD, band, first, SQUAREIDENTIEFERS[second], depth, 1, 0, 0, newExtent)
                  const verticalLines = await drawVertical(xGZD, band, first, SQUAREIDENTIEFERS[second], depth, 1, 0, 0, newExtent)
                  lines.push(...horizontalLines, ...verticalLines)
                }
              } catch (error) {
                // Out of segment
                continue
              }
            }
          }
          break
        }
      }
    }

  }
  return lines
}

const draw100kLines = (xGZD, ySegment, extent, lines) => {
  const firsts = {}
  for (let second = 0; second < SQUAREIDENTIEFERS.length; second++) {
    let lastValidPosition
    for (let first = 0; first < SQUAREIDENTIEFERS.length; first++) {
      let shouldBreak = false
      try {
        lastValidPosition = horizontal100kLines(xGZD, ySegment, first, SQUAREIDENTIEFERS[second], lastValidPosition, extent, lines)
        vertical100kLines(xGZD, ySegment, first, SQUAREIDENTIEFERS[second], firsts, extent, lines)
        firsts[first] = lastValidPosition
      } catch (err) {
        if (lastValidPosition) {
          const endPoint = getGzdPoint([lastValidPosition.lon, lastValidPosition.lat], true)
          const n100kChar = toMgrs([lastValidPosition.lat, lastValidPosition.lon]).substr(3, 1)
          lines.push(createLine(fromLonLat([endPoint[0], lastValidPosition.lat]), fromLonLat([lastValidPosition.lon, lastValidPosition.lat]), 2, n100kChar, loadedWrapBack))
          shouldBreak = true
        }
      }
      if (shouldBreak) {
        break
      }
    }
  }
}

const vertical100kLines = (xGZD, ySegment, first, second, firsts, extent, lines) => {
  if (firsts[first]) {
    const controllMGRS = toMgrs([firsts[first][0], firsts[first][1]], 5)
    // new Grid segment and rounding error
    if (controllMGRS.substr(3, 1) === SQUAREIDENTIEFERS[first] || controllMGRS.substr(10, 5) > 99999) {
      const target = buildMgrsString(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, 0, 0)
      drawGridLine(target, firsts[first], lines, 0, SQUAREIDENTIEFERS[first], false, 100000)
    }
  } else {
    const target = buildMgrsString(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, 0, 0)
    drawGridLine(target, undefined, lines, 0, SQUAREIDENTIEFERS[first], false, 100000)
  }
}

const horizontal100kLines = (xGZD, ySegment, first, second, lastValidPosition, extent, lines) => {
  const target = buildMgrsString(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, 0, 0)
  const newValidPosition = drawGridLine(target, lastValidPosition, lines, 0, second, true, 100000) || lastValidPosition
  if (first === SQUAREIDENTIEFERS.length - 1) {
    const startPoint = getGzdPoint(newValidPosition, true)
    lines.push(createLine(fromLonLat([startPoint[0], newValidPosition[1]]), fromLonLat(newValidPosition), 2, second, loadedWrapBack))
  }
  return newValidPosition
}


const drawVertical = async (xGZD, band, first, second, depth, currentDepth, sourceX, sourceY, extent) => {
  const lines = []
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let x = 0; x < 10; x++) {
    const newX = sourceX + (x * step)
    let lastValidPosition
    for (let y = 0; y <= 10; y++) {
      const newY = sourceY + (y * step)
      try {
        if (currentDepth === depth) {
          const target = buildMgrsString(xGZD, band, SQUAREIDENTIEFERS[first], second, newX, newY)
          const text = getDetailText(newX, SQUAREIDENTIEFERS[first], depth)
          lastValidPosition = drawGridLine(target, lastValidPosition, lines, depth, text, false, step) || lastValidPosition
        } else if (calcMinRenderArea(xGZD, band, SQUAREIDENTIEFERS[first], second, newX, newY, step, extent)) {
          const newLines = await drawVertical(xGZD, band, first, second, depth, currentDepth + 1, newX, newY, lines, extent)
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

const drawHorizontal = async (xGZD, band, first, second, depth, currentDepth, sourceX, sourceY, extent) => {
  const lines = []
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let y = 0; y < 10; y++) {
    const newY = sourceY + (y * step)
    let lastValidPosition
    for (let x = 0; x <= 10; x++) {
      const newX = sourceX + (x * step)
      try {
        if (currentDepth === depth) {
          const target = buildMgrsString(xGZD, band, SQUAREIDENTIEFERS[first], second, newX, newY)
          const text = getDetailText(newY, second, depth)
          lastValidPosition = drawGridLine(target, lastValidPosition, lines, depth, text, true, step) || lastValidPosition
        } else if (calcMinRenderArea(xGZD, band, SQUAREIDENTIEFERS[first], second, newX, newY, step, extent)) {
          const newLines = await drawHorizontal(xGZD, band, first, second, depth, currentDepth + 1, newX, newY, lines, extent)
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

const drawGridLine = (mgrs, lastPosition, lines, depth, text, isHorizontal, step) => {
  const lonlat = fromMgrs(mgrs)
  const controllMGRS = toMgrs([lonlat[0], lonlat[1]], 5)
  let newDepth = depth + 2
  if (depth > 0 && ((isHorizontal && mgrs.substr(10, 5) === '00000') || (!isHorizontal && mgrs.substr(5, 5) === '00000'))) {
    newDepth = depth
  }
  if (controllMGRS.substr(0, 3) === mgrs.substr(0, 3)) {
    if (lastPosition) {
      lines.push(createLine(fromLonLat(lastPosition), fromLonLat(lonlat), newDepth, text, loadedWrapBack))
    } else if (isHorizontal) {
      leftGzdConnection(mgrs, step, newDepth, depth, lines, text)
    } else {
      bottomGzdConnection(mgrs, step, newDepth, depth, lines, text)
    }
    return lonlat
  } else if (!isHorizontal && lastPosition) {
    topGzdConnection(mgrs, lastPosition, newDepth, depth, lines, text)
  } else if (isHorizontal && lastPosition && controllMGRS.substr(2, 1) === mgrs.substr(2, 1) && depth > 0) {
    rightGzdConnection(lonlat, lastPosition, newDepth, lines, text)
  }

}

const getPreviousBand = (band) => {
  let segment = band
  if (isNaN(segment)) {
    segment = Number(band.charCodeAt(0))
  }
  let newBand = String.fromCharCode(segment - 1)
  if (newBand === 'O' || newBand === 'I') {
    newBand = String.fromCharCode(segment - 2)
  }
  return newBand
}

const bottomGzdConnection = (mgrs, step, newDepth, depth, lines, text) => {
  try {
    const lonlat = fromMgrs(mgrs)
    const startPoint = getGzdPoint([lonlat[0], lonlat[1]], false)
    if (depth > 0) {
      // thanks norway
      if (mgrs.substr(5, 5) !== '00000' && mgrs.substr(10, 5) === '00000') {
        newDepth = depth + 2
      }
      const nextNorthing = fromatDetailLevel(Number(mgrs.substr(10, 5)) + step)
      const assumedNextPoint = fromMgrs(mgrs.substr(0, 10) + nextNorthing)
      const controllMGRS = toMgrs([assumedNextPoint[0], lonlat[1] - (assumedNextPoint[1] - lonlat[1])], 5)
      if (!isNaN(assumedNextPoint[0]) && controllMGRS.substr(0, 2) !== mgrs.substr(0, 2) && controllMGRS.substr(2, 1) !== mgrs.substr(2, 1)) {
        borderConnection(lonlat, assumedNextPoint, lines, newDepth, text, false, false)
      }
    } else {
      const newBand = getPreviousBand(mgrs.substr(2, 1))
      const newN100k = mgrs.substr(4, 1) === 'A' ? 'V' : getPreviousBand(mgrs.substr(4, 1))
      const newMGRS = mgrs.substr(0, 2) + newBand + mgrs.substr(3, 1) + newN100k + mgrs.substr(5, 10)
      const source = fromMgrs(newMGRS)
      const controllMGRS = toMgrs([source[0], source[1]], 5)
      if (controllMGRS.substr(0, 2) === mgrs.substr(0, 2)) {
        drawGridLine(mgrs, source, lines, 0, mgrs.substr(3, 1), false)
      } else {
        // thanks norway
        const diff = source[0] - lonlat[0]
        const newLon = (diff * (startPoint[1] - lonlat[1]) / (source[1] - lonlat[1])) + lonlat[0]
        drawGridLine(mgrs, [newLon, startPoint[1]], lines, 0, mgrs.e100k, false)
      }
    }
  } catch (error) {
    console.error('bottom GZD Border Connection shouldnt throw:' + error)
  }
}

const leftGzdConnection = (mgrs, step, newDepth, depth, lines, text) => {
  try {
    const lonlat = fromMgrs(mgrs)
    if (depth > 0) {
      const nextEasting = fromatDetailLevel(Number(mgrs.substr(5, 5)) + step)
      const assumedNextPoint = fromMgrs(mgrs.substr(0, 5) + nextEasting + mgrs.substr(10, 5))
      const startPoint = getGzdPoint([lonlat[0], lonlat[1]], false)
      if ((!isNaN(assumedNextPoint[0]) && lonlat[0] - (assumedNextPoint[0] - lonlat[0]) < startPoint[0])) {
        borderConnection(lonlat, assumedNextPoint, lines, newDepth, text, false, true)
      }

    } else {
      const startPoint = getGzdPoint([lonlat[0], lonlat[1]], false)
      lines.push(createLine(fromLonLat([startPoint[0], lonlat[1]]), fromLonLat([lonlat[0], lonlat[1]]), newDepth, text, loadedWrapBack))
    }
  } catch (error) {
    console.error('Left GZD Connection shouldnt throw:' + error)
  }
}

const rightGzdConnection = (lonlat, lastPosition, newDepth, lines, text) => {
  borderConnection(lastPosition, lonlat, lines, newDepth, text, true, true)
  throw new Error('Out of Segment')
}

const topGzdConnection = (mgrs, lastPosition, newDepth, depth, lines, text) => {
  const lonlat = fromMgrs(mgrs)
  const controllMGRS = toMgrs([lonlat[0], lonlat[1]], 5)
  if (mgrs.substr(5, 5) !== '00000' && mgrs.substr(10, 5) === '00000') {
    newDepth = depth + 2
  }
  if (depth > 0 && lastPosition && controllMGRS.substr(0, 2) === mgrs.substr(0, 2)) {
    lines.push(createLine(fromLonLat(lastPosition), fromLonLat([lonlat[0], lonlat[1]]), newDepth, text, loadedWrapBack))
    throw new Error('Out of Segment')
  } else if (lastPosition && controllMGRS.substr(0, 2) !== mgrs.substr(0, 2) && controllMGRS.substr(2, 1) !== mgrs.substr(2, 1)) {
    // thanks norway
    borderConnection(lastPosition, lonlat, lines, newDepth, text, true, false)
    if (depth > 0) {
      throw new Error('Out of Segment')
    }
  }
}

const borderConnection = (sourceLonLat, nextPointLonLat, lines, depth, text, isEndPoint, isHorizontal) => {
  try {
    const endPoint = getGzdPoint([sourceLonLat[0], sourceLonLat[1]], isEndPoint)
    if (isHorizontal) {
      const diff = nextPointLonLat[1] - sourceLonLat[1]
      const newLat = diff * (endPoint[0] - sourceLonLat[0]) / (nextPointLonLat[0] - sourceLonLat[0]) + sourceLonLat[1]
      lines.push(createLine(fromLonLat([endPoint[0], newLat]), fromLonLat([sourceLonLat[0], sourceLonLat[1]]), depth, text, loadedWrapBack))
    } else {
      const diff = nextPointLonLat[0] - sourceLonLat[0]
      const newLon = (diff * (endPoint[1] - sourceLonLat[1]) / (nextPointLonLat[1] - sourceLonLat[1])) + sourceLonLat[0]
      lines.push(createLine(fromLonLat([newLon, endPoint[1]]), fromLonLat([sourceLonLat[0], sourceLonLat[1]]), depth, text, loadedWrapBack))
    }

  } catch (error) {
    console.error('couldnt connect GZD Segments:' + error)
  }
}

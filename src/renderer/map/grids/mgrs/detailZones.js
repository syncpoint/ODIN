import { fromLonLat, toLonLat } from 'ol/proj'
import coordinateFormat from '../../../../shared/coord-format'
import Mgrs, { LatLon } from 'geodesy/mgrs'
import { createLine, wrapX } from '../utils'
import { getGzdPoint } from './gzdZones'
import { boundingExtent, intersects, equals } from 'ol/extent'
// import ("./proj/Projection.js").default

const SQUAREIDENTIEFERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
var loadedExtent
var loadedWrapBack
export const getSquareGrid = async (extent, projection, depth, callback) => {
  if (loadedExtent && equals(extent, loadedExtent)) {
    return
  }
  loadedExtent = extent
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
                if (calcMinRenderArea(xGZD, band, SQUAREIDENTIEFERS[first], SQUAREIDENTIEFERS[second], 0, 0, 100000, startPoint, endPoint, newExtent)) {
                  const horizontalLines = await drawHorizontal(xGZD, band, first, SQUAREIDENTIEFERS[second], depth, 1, 0, 0, startPoint, endPoint, newExtent)
                  const verticalLines = await drawVertical(xGZD, band, first, SQUAREIDENTIEFERS[second], depth, 1, 0, 0, startPoint, endPoint, newExtent)
                  lines.push(...horizontalLines, ...verticalLines)
                }
              } catch (error) {
                // likely out of segment
                continue
              }
            }
          }
          break
        }
      }
    }

  }
  callback(lines)
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
          const mgrs = new LatLon(lastValidPosition.lat, lastValidPosition.lon).toUtm().toMgrs()
          lines.push(createLine(fromLonLat([endPoint[0], lastValidPosition.lat]), fromLonLat([lastValidPosition.lon, lastValidPosition.lat]), 2, mgrs.n100k, loadedWrapBack))
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
    const controllMGRS = new LatLon(firsts[first].lat, firsts[first].lon).toUtm().toMgrs()
    // new Grid segment and rounding error
    if (controllMGRS.e100k === SQUAREIDENTIEFERS[first] || controllMGRS.easting > 99999) {
      const target = new Mgrs(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, 0, 0)
      drawLineGrid(target, firsts[first], lines, 0, SQUAREIDENTIEFERS[first], false, 100000)
    }
  } else {
    const target = new Mgrs(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, 0, 0)
    drawLineGrid(target, undefined, lines, 0, SQUAREIDENTIEFERS[first], false, 100000)
  }
}

const horizontal100kLines = (xGZD, ySegment, first, second, lastValidPosition, extent, lines) => {
  const target = new Mgrs(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, 0, 0)
  const newValidPosition = drawLineGrid(target, lastValidPosition, lines, 0, second, true, 100000) || lastValidPosition
  if (first === SQUAREIDENTIEFERS.length - 1) {
    const startPoint = getGzdPoint([newValidPosition.lon, newValidPosition.lat], true)
    lines.push(createLine(fromLonLat([startPoint[0], newValidPosition.lat]), fromLonLat([newValidPosition.lon, newValidPosition.lat]), 2, second, loadedWrapBack))
  }
  return newValidPosition
}


const drawVertical = async (xGZD, band, first, second, depth, currentDepth, sourceX, sourceY, startPoint, endPoint, extent) => {
  const lines = []
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let x = 0; x < 10; x++) {
    const newX = sourceX + (x * step)
    let lastValidPosition
    for (let y = 0; y <= 10; y++) {
      const newY = sourceY + (y * step)
      try {
        if (currentDepth === depth) {
          const target = new Mgrs(xGZD, band, SQUAREIDENTIEFERS[first], second, newX, newY)
          const text = getDetailText(newX, SQUAREIDENTIEFERS[first], depth)
          lastValidPosition = drawLineGrid(target, lastValidPosition, lines, depth, text, false, step) || lastValidPosition
        } else if (calcMinRenderArea(xGZD, band, SQUAREIDENTIEFERS[first], second, newX, newY, step, startPoint, endPoint, extent)) {
          const newLines = await drawVertical(xGZD, band, first, second, depth, currentDepth + 1, newX, newY, lines, startPoint, endPoint, extent)
          lines.push(...newLines)
        }
      } catch (error) {
        // likely out of segment
        break
      }
    }
  }
  return lines
}

const drawHorizontal = async (xGZD, band, first, second, depth, currentDepth, sourceX, sourceY, startPoint, endPoint, extent) => {
  const lines = []
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let y = 0; y < 10; y++) {
    const newY = sourceY + (y * step)
    let lastValidPosition
    for (let x = 0; x <= 10; x++) {
      const newX = sourceX + (x * step)
      try {
        if (currentDepth === depth) {
          const target = new Mgrs(xGZD, band, SQUAREIDENTIEFERS[first], second, newX, newY)
          const text = getDetailText(newY, second, depth)
          lastValidPosition = drawLineGrid(target, lastValidPosition, lines, depth, text, true, step) || lastValidPosition
        } else if (calcMinRenderArea(xGZD, band, SQUAREIDENTIEFERS[first], second, newX, newY, step, startPoint, endPoint, extent)) {
          const newLines = await drawHorizontal(xGZD, band, first, second, depth, currentDepth + 1, newX, newY, lines, startPoint, endPoint, extent)
          lines.push(...newLines)
        }
      } catch (error) {
        // likely out of segment
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
const calcMinRenderArea = (xGZD, segment, first, second, x, y, step, min, max, extent) => {
  try {
    const segmentBottomLeft = new Mgrs(xGZD, segment, first, second, x, y).toUtm().toLatLon()
    const segmentBottomRight = new Mgrs(xGZD, segment, first, second, x + step, y).toUtm().toLatLon()
    const segmentTopLeft = new Mgrs(xGZD, segment, first, second, x, y + step).toUtm().toLatLon()
    const segmentTopRight = new Mgrs(xGZD, segment, first, second, x + step, y + step).toUtm().toLatLon()
    const segmentExtent = boundingExtent([
      fromLonLat([segmentBottomLeft.lon, segmentBottomLeft.lat]),
      fromLonLat([segmentBottomRight.lon, segmentBottomRight.lat]),
      fromLonLat([segmentTopLeft.lon, segmentTopLeft.lat]),
      fromLonLat([segmentTopRight.lon, segmentTopRight.lat])
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
const drawLineGrid = (mgrs, lastPosition, lines, depth, text, isHorizontal, step) => {
  const latlon = mgrs.toUtm().toLatLon()
  const controllMGRS = new LatLon(latlon.lat, latlon.lon).toUtm().toMgrs()
  let newDepth = depth + 2
  if (mgrs.zone === 30 && mgrs.band === 'W' && mgrs.e100k === 'W' && mgrs.n100k === 'R' && mgrs.easting === 3000 && mgrs.northing === 98000) {
    console.log(mgrs, controllMGRS)
  }
  if (depth > 0 && (mgrs.easting === 0 || mgrs.northing === 0)) {
    newDepth = depth
  }
  if (controllMGRS.zone === mgrs.zone && controllMGRS.band === mgrs.band) {
    if (lastPosition) {
      lines.push(createLine(fromLonLat([lastPosition.lon, lastPosition.lat]), fromLonLat([latlon.lon, latlon.lat]), newDepth, text, loadedWrapBack))
    } else if (isHorizontal) {
      leftGzdConnection(mgrs, step, newDepth, depth, lines, text)
    } else {
      bottomGZDConnection(mgrs, step, newDepth, depth, lines, text)
    }
    return latlon
  } else if (!isHorizontal && lastPosition) {
    topGZDConnection(mgrs, lastPosition, newDepth, depth, lines, text)
  } else if (isHorizontal && lastPosition) {
    if (controllMGRS.band === mgrs.band && depth > 0) {
      rightGZDConnection(latlon, lastPosition, newDepth, lines, text)
    }
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
const bottomGZDConnection = (mgrs, step, newDepth, depth, lines, text) => {
  try {
    const latlon = mgrs.toUtm().toLatLon()
    const startPoint = getGzdPoint([latlon.lon, latlon.lat], false)
    if (depth > 0) {
      if (mgrs.easting !== 0 && mgrs.northing === 0) {
        newDepth = depth + 2
      }
      // connction between 31 W and 32 V... is wrong.
      const assumedNextPoint = new Mgrs(mgrs.zone, mgrs.band, mgrs.e100k, mgrs.n100k, mgrs.easting, mgrs.northing - step).toUtm().toLatLon()
      const controllLatLon = new LatLon(assumedNextPoint.lat, assumedNextPoint.lon)
      if ((controllLatLon.toUtm().toMgrs().zone !== mgrs.zone) && (controllLatLon.toUtm().toMgrs().band !== mgrs.band)) {
        const startPoint = getGzdPoint([latlon.lon, latlon.lat], false)
        const diff = assumedNextPoint.lon - latlon.lon
        const newLon = (diff * (startPoint[1] - latlon.lat) / (assumedNextPoint.lat - latlon.lat)) + latlon.lon
        lines.push(createLine(fromLonLat([newLon, startPoint[1]]), fromLonLat([latlon.lon, latlon.lat]), newDepth, text, loadedWrapBack))
      }
    } else {
      const newBand = getPreviousBand(mgrs.band)
      const newN100k = mgrs.n100k === 'A' ? 'V' : getPreviousBand(mgrs.n100k)
      const source = new Mgrs(mgrs.zone, newBand, mgrs.e100k, newN100k, 0, 0).toUtm().toLatLon()
      const controllMGRS = new LatLon(source.lat, source.lon).toUtm().toMgrs()
      if (controllMGRS.zone === mgrs.zone) {
        drawLineGrid(mgrs, source, lines, 0, mgrs.e100k, false)
      } else {
        // thanks norway
        const diff = source.lon - latlon.lon
        const newLon = (diff * (startPoint[1] - latlon.lat) / (source.lat - latlon.lat)) + latlon.lon
        drawLineGrid(mgrs, new LatLon(startPoint[1], newLon), lines, 0, mgrs.e100k, false)
      }
    }
  } catch (error) {
    console.error('bottom GZD Border Connection shouldnt throw:' + error)
  }
}

const leftGzdConnection = (mgrs, step, newDepth, depth, lines, text) => {
  try {
    const latlon = mgrs.toUtm().toLatLon()
    if (depth > 0) {
      const assumedNextPoint = new Mgrs(mgrs.zone, mgrs.band, mgrs.e100k, mgrs.n100k, mgrs.easting + step, mgrs.northing).toUtm().toLatLon()
      const endPoint = getGzdPoint([latlon.lon, latlon.lat], false)
      const diff = assumedNextPoint.lat - latlon.lat
      const newLat = diff * (endPoint[0] - latlon.lon) / (assumedNextPoint.lon - latlon.lon) + latlon.lat
      if (mgrs.easting === 0 && mgrs.northing !== 0) {
        newDepth = depth + 2
      }
      let controllLatLon = new Mgrs(mgrs.zone, mgrs.band, mgrs.e100k, mgrs.n100k, mgrs.easting - step, mgrs.northing).toUtm().toLatLon()
      controllLatLon = new LatLon(controllLatLon.lat, controllLatLon.lon)
      // !== (controllLatLon.toUtm().toMgrs().band !== mgrs.band)
      if ((controllLatLon.toUtm().toMgrs().zone !== mgrs.zone)) {
        lines.push(createLine(fromLonLat([endPoint[0], newLat]), fromLonLat([latlon.lon, latlon.lat]), newDepth, text, loadedWrapBack))
      }
    } else {
      const startPoint = getGzdPoint([latlon.lon, latlon.lat], false)
      lines.push(createLine(fromLonLat([startPoint[0], latlon.lat]), fromLonLat([latlon.lon, latlon.lat]), newDepth, text, loadedWrapBack))
    }
  } catch (error) {
    console.error('Left GZD Connection shouldnt throw:' + error)
  }
}

const rightGZDConnection = (latlon, lastPosition, newDepth, lines, text) => {
  borderConnection(lastPosition, latlon, lines, newDepth, text, true, true)
  throw new Error('Out of Segment')
}

const topGZDConnection = (mgrs, lastPosition, newDepth, depth, lines, text) => {
  const latlon = mgrs.toUtm().toLatLon()
  const controllMGRS = new LatLon(latlon.lat, latlon.lon).toUtm().toMgrs()
  if (depth > 0 && lastPosition && controllMGRS.zone === mgrs.zone) {
    const latlon = mgrs.toUtm().toLatLon()
    lines.push(createLine(fromLonLat([lastPosition.lon, lastPosition.lat]), fromLonLat([latlon.lon, latlon.lat]), newDepth, text, loadedWrapBack))
    throw new Error('Out of Segment')
  } else if (lastPosition && controllMGRS.zone !== mgrs.zone && controllMGRS.band !== mgrs.band) {
    // thanks norway
    borderConnection(lastPosition, latlon, lines, newDepth, text, true, false)
    if (depth > 0) {
      throw new Error('Out of Segment')
    }
  }
}

const borderConnection = (sourceLatLon, nextPointLatLon, lines, depth, text, isEndPoint, isHorizontal) => {
  try {
    const endPoint = getGzdPoint([sourceLatLon.lon, sourceLatLon.lat], isEndPoint)
    if (isHorizontal) {
      const diff = nextPointLatLon.lat - sourceLatLon.lat
      const newLat = diff * (endPoint[0] - sourceLatLon.lon) / (nextPointLatLon.lon - sourceLatLon.lon) + sourceLatLon.lat
      lines.push(createLine(fromLonLat([endPoint[0], newLat]), fromLonLat([sourceLatLon.lon, sourceLatLon.lat]), depth, text, loadedWrapBack))
    } else {
      const diff = nextPointLatLon.lon - sourceLatLon.lon
      const newLon = (diff * (endPoint[1] - sourceLatLon.lat) / (nextPointLatLon.lat - sourceLatLon.lat)) + sourceLatLon.lon
      lines.push(createLine(fromLonLat([newLon, endPoint[1]]), fromLonLat([sourceLatLon.lon, sourceLatLon.lat]), depth, text, loadedWrapBack))
    }

  } catch (error) {
    console.log('couldnt connect GZD Segments:' + error)
  }
}

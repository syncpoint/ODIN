import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Stroke, Text, Fill } from 'ol/style'
import { fromLonLat, toLonLat } from 'ol/proj'
import coordinateFormat from '../../../shared/coord-format'
// import LatLon from 'geodesy/latlon-ellipsoidal-vincenty'
import { bbox, all } from 'ol/loadingstrategy'
import Mgrs, { LatLon } from 'geodesy/mgrs'
import { isWithin100kGrid, isWithinDetailGrid, createLine, createMultiLine } from './utils'
const SQUAREIDENTIEFERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

export const MgrsGrid = (maxResolutions = [10000, 1200, 250, 20], minResolutions = [0, 0, 20, 0]) => {
  const Grids = []
  const vectorSourceGZD = new VectorSource({
    loader: (extent, resolution, projection) => getGzdGrid(projection.extent_, (features) => {
      vectorSourceGZD.clear()
      vectorSourceGZD.addFeatures(features)
    }),
    strategy: all,
    wrapX: true
  })
  Grids.push(
    new VectorLayer({
      maxResolution: maxResolutions[0],
      minResolution: minResolutions[0],
      source: vectorSourceGZD,
      style: styleFunction
    })
  )
  for (let i = 0; i < 3; i++) {
    const vectorSourceDetailSquares = new VectorSource({
      loader: (extent, resolution, projection) => getSquareGrid(extent, i, (features) => {
        vectorSourceDetailSquares.clear()
        vectorSourceDetailSquares.addFeatures(features)
      }),
      strategy: bbox,
      wrapX: true
    })
    Grids.push(
      new VectorLayer({
        maxResolution: maxResolutions[i + 1],
        minResolution: minResolutions[i + 1],
        source: vectorSourceDetailSquares,
        style: styleFunction
      })
    )
  }
  return Grids
}

const getMgrs = (coords, zIndex) => {
  const lonLat1 = toLonLat([coords[0], coords[1]])
  const lonLat2 = toLonLat([coords[2], coords[3]])
  const isHorizontal = Math.abs(lonLat1[0] - lonLat2[0]) < Math.abs(lonLat1[1] - lonLat2[1])
  let mgrs = coordinateFormat.format({ lng: (lonLat1[0] + lonLat2[0]) / 2, lat: (lonLat1[1] + lonLat2[1]) / 2 }).replace(' ', '')
  switch (zIndex) {
    case 1: {
      mgrs = mgrs.substr(0, 3)
      break
    }
    case 2: {
      mgrs = mgrs.substr(3, 2)
      break
    }
    case 3: {
      if (isHorizontal) {
        mgrs = mgrs.substr(6, 1)
        break
      }
      mgrs = mgrs.substr(12, 1)
      break
    }
    case 4: {
      if (isHorizontal) {
        mgrs = mgrs.substr(6, 2)
        break
      }
      mgrs = mgrs.substr(12, 2)
      break
    }
    case 5: {
      if (isHorizontal) {
        mgrs = mgrs.substr(6, 3)
        break
      }
      mgrs = mgrs.substr(12, 3)
      break
    }
  }
  return mgrs
}
const styleFunction = (feature) => {
  const styles = new Style({
    stroke: new Stroke({ color: 'rgba(255,0,0,0.5)', width: 5 / feature.values_.zIndex }),
    text: new Text({
      text: getMgrs(feature.values_.geometry.flatCoordinates, feature.values_.zIndex),
      font: '20px serif',
      textBaseline: 'ideographic',
      rotateWithView: true,
      backgroundFill: new Fill({ color: 'rgba(255,255,255,1.0)', width: 1 }),
      fill: new Fill({ color: 'rgba(255,0,0,1.0)' }),
      placement: 'POINT',
      offsetY: 7
    })
  })
  return styles
}
const getGzdGrid = (extent, callback) => {
  const lines = []
  const startPoint = getGzdPoint(toLonLat([extent[0], extent[1]]), false)
  const endPoint = getGzdPoint(toLonLat([extent[2], extent[3]]), true)
  let x = startPoint[0]
  let y = startPoint[1]
  while (x < endPoint[0]) {
    while (y < endPoint[1] && y < 72) {
      if (x === 6 && y === 56) {
        // thanks norway
        lines.push(createLine(fromLonLat([0, 56]), fromLonLat([3, 56]), 1))
        lines.push(createLine(fromLonLat([3, 56]), fromLonLat([3, 64]), 1))
        lines.push(createLine(fromLonLat([3, 56]), fromLonLat([12, 56]), 1))
      } else {
        lines.push(createLine(fromLonLat([x, y]), fromLonLat([x + 6, y]), 1))
        lines.push(createLine(fromLonLat([x, y]), fromLonLat([x, y + 8]), 1))
      }
      y = y + 8
    }
    lines.push(createLine(fromLonLat([x, y]), fromLonLat([x + 6, y]), 1))
    x = x + 6
    y = -80
  }
  generateXSegment(lines)
  callback(lines)
}

const getGzdPoint = (point, isEndPoint) => {
  let x = -180
  while (x + 6 < point[0]) {
    x = x + 6
  }
  let y = -80
  while (y + 8 < point[1]) {
    y = y + 8
  }
  if (isEndPoint) {
    x = x + 6
    y = y + 8
  }
  // thanks norway
  if (x === 6 && y === 64) {
    x = 3
  }
  return [x, y]
}
const generateXSegment = (lines) => {
  let x = -180
  const y = 72
  while (x < 180) {
    lines.push(createLine(fromLonLat([x, y]), fromLonLat([x + 6, y]), 1))
    lines.push(createLine(fromLonLat([x, y]), fromLonLat([x, y + 12]), 1))
    lines.push(createLine(fromLonLat([x, y + 12]), fromLonLat([x + 6 + 6, y + 12]), 1))
    // thanks norway (everything but else)
    if (x === 0) {
      x = 9
    } else if (x === 9) {
      x = 21
    } else if (x === 21) {
      x = 33
    } else if (x === 33) {
      x = 42
    } else {
      x = x + 6
    }
  }
}
const getSquareGrid = (extent, depth, callback) => {
  const lines = []
  const startPoint = toLonLat([extent[0], extent[1]])
  const endPoint = toLonLat([extent[2], extent[3]])
  const startMGRS = coordinateFormat.format({ lng: startPoint[0], lat: startPoint[1] }).replace(' ', '')
  const endMGRS = coordinateFormat.format({ lng: endPoint[0], lat: endPoint[1] }).replace(' ', '')
  for (let xGZD = startMGRS.substr(0, 2); xGZD <= endMGRS.substr(0, 2); xGZD++) {
    for (let ySegment = Number(startMGRS.charCodeAt(2)); ySegment <= Number(endMGRS.charCodeAt(2)); ySegment++) {
      switch (depth) {
        case 0: {
          draw100kLines(xGZD, ySegment, lines)
          break
        }
        default: {
          SQUAREIDENTIEFERS.forEach(second => {
            for (let first = 0; first < SQUAREIDENTIEFERS.length; first++) {
              if (!isWithin100kGrid(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, startPoint, endPoint)) {
                continue
              }
              drawHorizontal(xGZD, ySegment, first, second, depth, 1, 0, 0, lines, startPoint, endPoint)
              drawVertical(xGZD, ySegment, first, second, depth, 1, 0, 0, lines, startPoint, endPoint)
            }
          })
          break
        }
      }
    }

  }
  callback(lines)
}
const draw100kLines = (xGZD, ySegment, lines) => {
  const firsts = {}
  SQUAREIDENTIEFERS.forEach((second, index) => {
    let lastValidPosition
    for (let first = 0; first < SQUAREIDENTIEFERS.length; first++) {
      let shouldBreak = false
      try {
        lastValidPosition = horizontal100kLines(xGZD, ySegment, first, second, lastValidPosition, lines)
        vertical100kLines(xGZD, ySegment, first, second, index, firsts, lines)
        firsts[first] = lastValidPosition
      } catch (err) {
        if (lastValidPosition) {
          const startPoint = getGzdPoint([lastValidPosition.lon, lastValidPosition.lat], true)
          lines.push(createLine(fromLonLat([startPoint[0], lastValidPosition.lat]), fromLonLat([lastValidPosition.lon, lastValidPosition.lat]), 2))
          shouldBreak = true
        }
      }
      if (shouldBreak) {
        break
      }
    }
  })
}

const vertical100kLines = (xGZD, ySegment, first, second, secondIndex, firsts, lines) => {
  if (firsts[first]) {
    const controllMGRS = new LatLon(firsts[first].lat, firsts[first].lon).toUtm().toMgrs()
    // new Grid segment and rounding error
    if (controllMGRS.e100k === SQUAREIDENTIEFERS[first] || controllMGRS.easting > 99999) {
      const target = new Mgrs(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, 0, 0)
      drawLineGrid(target, firsts[first], lines, 0, false)
    }
  } else {
    try {
      let newBand = String.fromCharCode(ySegment - 1)
      if (newBand === 'O' || newBand === 'I') {
        newBand = String.fromCharCode(ySegment - 2)
      }
      let newSecond
      if (secondIndex === 0) {
        newSecond = 'V'
      } else {
        newSecond = SQUAREIDENTIEFERS[secondIndex - 1]
      }
      const target = new Mgrs(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, 0, 0)
      const source = new Mgrs(xGZD, newBand, SQUAREIDENTIEFERS[first], newSecond, 0, 0).toUtm().toLatLon()

      const controllMGRS = new LatLon(source.lat, source.lon).toUtm().toMgrs()
      if (controllMGRS.zone === xGZD) {
        drawLineGrid(target, source, lines, 0, false)
      }
    } catch (error) {
      console.log(error)
    }
  }
}
const horizontal100kLines = (xGZD, ySegment, first, second, lastValidPosition, lines) => {
  const target = new Mgrs(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, 0, 0)
  const newValidPosition = drawLineGrid(target, lastValidPosition, lines, 0, true) || lastValidPosition
  if (first === SQUAREIDENTIEFERS.length - 1) {
    const startPoint = getGzdPoint([newValidPosition.lon, newValidPosition.lat], true)
    lines.push(createLine(fromLonLat([startPoint[0], newValidPosition.lat]), fromLonLat([newValidPosition.lon, newValidPosition.lat]), 2))
  }
  return newValidPosition
}


const drawVertical = (xGZD, ySegment, first, second, depth, currentDepth, sourceX, sourceY, lines, startPoint, endPoint) => {
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let x = 0; x < 10; x++) {
    const newX = sourceX + (x * step)
    let lastValidPosition
    for (let y = 0; y <= 10; y++) {
      const newY = sourceY + (y * step)
      if (currentDepth === depth) {
        try {
          const target = new Mgrs(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, newX, newY)
          lastValidPosition = drawLineGrid(target, lastValidPosition, lines, depth, false) || lastValidPosition
        } catch (error) {
          break
        }
      } else if (isWithinDetailGrid(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, newX, newY, step, startPoint, endPoint)) {
        drawVertical(xGZD, ySegment, first, second, depth, currentDepth + 1, newX, newY, lines, startPoint, endPoint)
      }
    }
  }
}

const drawHorizontal = (xGZD, ySegment, first, second, depth, currentDepth, sourceX, sourceY, lines, startPoint, endPoint) => {
  const step = 10000 / Math.pow(10, currentDepth - 1)
  for (let y = 0; y < 10; y++) {
    const newY = sourceY + (y * step)
    let lastValidPosition
    for (let x = 0; x <= 10; x++) {
      const newX = sourceX + (x * step)
      if (currentDepth === depth) {
        try {
          const target = new Mgrs(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, newX, newY)
          lastValidPosition = drawLineGrid(target, lastValidPosition, lines, depth, true) || lastValidPosition
        } catch (error) {
          break
        }
      } else if (isWithinDetailGrid(xGZD, String.fromCharCode(ySegment), SQUAREIDENTIEFERS[first], second, newX, newY, step, startPoint, endPoint)) {
        drawHorizontal(xGZD, ySegment, first, second, depth, currentDepth + 1, newX, newY, lines, startPoint, endPoint)
      }
    }
  }
}

const drawLineGrid = (mgrs, lastPosition, lines, depth, isHorizontal) => {
  const latlon = mgrs.toUtm().toLatLon()
  const controllMGRS = new LatLon(latlon.lat, latlon.lon).toUtm().toMgrs()
  if (controllMGRS.zone === mgrs.zone && controllMGRS.band === mgrs.band) {
    if (lastPosition) {
      lines.push(createLine(fromLonLat([lastPosition.lon, lastPosition.lat]), fromLonLat([latlon.lon, latlon.lat]), depth + 2))
    } else if (isHorizontal && depth === 0) {
      // thanks norway
      if (mgrs.zone === 32 && mgrs.band === 'V') {
        lines.push(createLine(fromLonLat([3, latlon.lat]), fromLonLat([latlon.lon, latlon.lat]), depth + 2))
      } else {
        const startPoint = getGzdPoint([latlon.lon, latlon.lat], false)
        lines.push(createLine(fromLonLat([startPoint[0], latlon.lat]), fromLonLat([latlon.lon, latlon.lat]), depth + 2))
      }
    }
    return latlon
  } else if (controllMGRS.zone === mgrs.zone && lastPosition && !isHorizontal && depth > 0) {
    mgrs.band = controllMGRS.band
    const latlon = mgrs.toUtm().toLatLon()
    lines.push(createLine(fromLonLat([lastPosition.lon, lastPosition.lat]), fromLonLat([latlon.lon, latlon.lat]), depth + 2))
  } else if (controllMGRS.band === mgrs.band && lastPosition && isHorizontal && depth > 0) {
    const endPoint = getGzdPoint([lastPosition.lon, lastPosition.lat], true)
    const diff = latlon.lat - lastPosition.lat
    const newLat = diff * (endPoint[0] - lastPosition.lon) / (latlon.lon - lastPosition.lon)
    lines.push(createLine(fromLonLat([endPoint[0], newLat + lastPosition.lat]), fromLonLat([lastPosition.lon, lastPosition.lat]), depth + 2))
    const nextlon = endPoint[0] + (endPoint[0] - lastPosition.lon)
    lines.push(createLine(fromLonLat([endPoint[0], newLat + lastPosition.lat]), fromLonLat([nextlon, lastPosition.lat]), depth + 2))
    throw new Error('Out of Segment')
  }
}


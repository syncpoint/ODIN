import { toLonLat } from 'ol/proj'
import { SEGMENTIDENTIEFERS, toMgrs } from './mgrs'


export const loopGZD = (extent, cb) => {
  loopGzdZones(extent, (gzd) => {
    loopGzdBands(extent, (band) => {
      cb(gzd, band)
    })
  })
}

const loopGzdZones = (extent, cb) => {
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

  const gzdRange = getGZDRange(extent)
  for (let gzd = gzdRange[0]; gzd <= gzdRange[1]; gzd++) {
    cb(gzd)
  }
}

const loopGzdBands = (extent, cb) => {
  const getBandRange = (extent) => {
    const startPoint = toLonLat([extent[0], extent[1]])
    const endPoint = toLonLat([extent[2], extent[3]])
    const bottomLeftMGRS = toMgrs([startPoint[0], startPoint[1]])
    const topRightMGRS = toMgrs([endPoint[0], endPoint[1]])
    const startBand = Math.max(SEGMENTIDENTIEFERS.indexOf(bottomLeftMGRS.substr(2, 1)), SEGMENTIDENTIEFERS.indexOf('C'))
    const endBand = Math.min(SEGMENTIDENTIEFERS.indexOf(topRightMGRS.substr(2, 1)), SEGMENTIDENTIEFERS.indexOf('X'))
    return [startBand, endBand]
  }

  const bandRange = getBandRange(extent)
  for (let ySegment = bandRange[0]; ySegment <= bandRange[1]; ySegment++) {
    const band = SEGMENTIDENTIEFERS[ySegment]
    cb(band)
  }
}

export const loop100k = (cb) => {
  loopE100k((e100k) => loopN100k((n100k) => cb(e100k, n100k)))
}

export const loopE100k = (cb) => {
  for (let e100k = 0; e100k < SEGMENTIDENTIEFERS.length; e100k++) {
    cb(SEGMENTIDENTIEFERS[e100k])
  }
}

export const loopN100k = (cb) => {
  for (let n100k = 0; n100k < SEGMENTIDENTIEFERS.length - 4; n100k++) {
    cb(SEGMENTIDENTIEFERS[n100k])
  }
}

/**
 * @param {Number} step segment Length
 * @param {Number} parentSegmentPos parent Segment Easting/Northing
 * @param {Function} cb Function that handles the new Position, returns true if loop should break
 */
export const loopNumericalSegments = (step, parentSegmentPos, cb) => {
  for (let pos = 0; pos <= 10 && parentSegmentPos + (pos * step) <= 100000; pos++) {
    const newPosition = parentSegmentPos + (pos * step)
    cb(newPosition)
  }
}

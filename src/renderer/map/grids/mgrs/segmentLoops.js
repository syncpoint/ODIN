import { toLonLat } from 'ol/proj'
import { SEGMENTIDENTIEFERS, toMgrs } from './mgrs'
import { range } from 'ramda'


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
    // expected to be used exclusive the maximum value hence why +1 is required
    return [startGZD, endGZD + 1]
  }

  const gzdRange = getGZDRange(extent)
  range(gzdRange[0], gzdRange[1]).forEach(gzd => {
    cb(gzd)
  })
}

const loopGzdBands = (extent, cb) => {
  const getBandRange = (extent) => {
    const startPoint = toLonLat([extent[0], extent[1]])
    const endPoint = toLonLat([extent[2], extent[3]])
    const bottomLeftMGRS = toMgrs([startPoint[0], startPoint[1]])
    const topRightMGRS = toMgrs([endPoint[0], endPoint[1]])
    const startBand = Math.max(SEGMENTIDENTIEFERS.indexOf(bottomLeftMGRS.substr(2, 1)), SEGMENTIDENTIEFERS.indexOf('C'))
    const endBand = Math.min(SEGMENTIDENTIEFERS.indexOf(topRightMGRS.substr(2, 1)), SEGMENTIDENTIEFERS.indexOf('X'))
    // expected to be used exclusive the maximum value hence why +1 is required
    return [startBand, endBand + 1]
  }

  const bandRange = getBandRange(extent)
  SEGMENTIDENTIEFERS.slice(bandRange[0], bandRange[1]).forEach(band => {
    cb(band)
  })
}

export const loop100k = (cb) => {
  loopE100k((e100k) => loopN100k((n100k) => cb(e100k, n100k)))
}

export const loopE100k = (cb) => {
  SEGMENTIDENTIEFERS.forEach(e100k => {
    cb(e100k)
  })
}

// up to V
export const loopN100k = (cb) => {
  SEGMENTIDENTIEFERS.slice(0, SEGMENTIDENTIEFERS.length - 4).forEach(n100k => {
    cb(n100k)
  })
}
/**
 * unused
 * @param {Number} step segment Length
 * @param {Number} parentSegmentPos parent Segment Easting/Northing
 * @param {Function} cb Function that handles the new Position, returns true if loop should break
 */
export const loopNumericalSegments = (step, parentSegmentPos, cb) => {
  range(0, 10).forEach(pos => {
    const newPosition = parentSegmentPos + (pos * step)
    cb(newPosition)
  })
}

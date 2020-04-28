import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { getCenter, getWidth } from 'ol/extent'

/**
 * creates a ol LineString
 * @param {[Number, Number]} startPoint Line start
 * @param {[Number, Number]} endPoint Line end
 * @param {Number} visualDepth Number used to calculate the width of a Line
 * @param {Function} wrapBack function to use for calculating X-Coordinates back to the inital world
 * @returns {LineString} linestrin feature
 */
export const createLine = (startPoint, endPoint, visualDepth, wrapBack) => {
  if (wrapBack) {
    startPoint[0] = wrapBack(startPoint[0])
    endPoint[0] = wrapBack(endPoint[0])
  }
  const feature = new Feature({
    geometry: new LineString([startPoint[0], startPoint[1], endPoint[0], endPoint[1]], 'XY'),
    detail: visualDepth
  })
  return feature
}

/**
 * the extent can be overlaping multiple worlds (startPoint < -180° || endPoint > 180°)
 * cuts extent into <= two extents for each world the view is in
 * example: extent long range = -190° to -170°, results would be two extents ranging from -190° to -180° and -180° to -170°
 * @param {[Number, Number, Number, Number]} extent ol view Extent
 * @param {Object} projection ol projection used to get the world extent
 * @returns {[Number, Number, Number, Number][]} array of extents
 */
export const splitWorlds = (extent, projection) => {
  const extents = []
  const worldExtent = projection.getExtent()
  if (projection.canWrapX() && (extent[0] < worldExtent[0] || extent[2] >= worldExtent[2])) {
    const worldWidth = getWidth(worldExtent)
    const worldsAway1 = getWorldsAway(extent[0], worldExtent[0], worldWidth)
    const worldsAway2 = getWorldsAway(extent[2], worldExtent[0], worldWidth)
    if (worldsAway1 !== worldsAway2) {
      const worldsAway = Math.max(worldsAway1, worldsAway2)
      const extent1 = [...extent]
      extent1[0] = worldExtent[0] + worldsAway * worldWidth + 1
      extents.push(extent1)
      const extent2 = [...extent]
      extent2[2] = worldExtent[0] + worldsAway * worldWidth - 1
      extents.push(extent2)
      return extents
    }
  }
  return [extent]
}
/**
 * transforms the extent to the the centered world
 * the extent can be over multiple worlds (startPoint < -180° || endPoint > 180°)
 * since most libraries can't handle those coordinates they need to be transformed into coordinates that fit into the initial world
 * @param {[Number,Number,Number,Number]} extent ol view Extent
 * @param {Object} projection view projection
 * @returns {{e: [Number,Number,Number,Number], f: Function}} e: transformed extent,  f: function to transform x coordinates back to the initial world
 */
export const wrapX = (extent, projection) => {
  const projectionExtent = projection.getExtent()
  const center = getCenter(extent)
  if (projection.canWrapX() && (center[0] < projectionExtent[0] || center[0] >= projectionExtent[2])) {
    const wrapedExtent = [...extent]
    const worldWidth = getWidth(projectionExtent)
    const worldsAway = getWorldsAway(center[0], projectionExtent[0], worldWidth)
    wrapedExtent[0] -= worldsAway * worldWidth
    wrapedExtent[2] -= worldsAway * worldWidth

    const wrapBack = (x) => {
      x += worldsAway * worldWidth
      return x
    }
    return { e: wrapedExtent, f: wrapBack }
  }
  return { e: extent }
}

const getWorldsAway = (x, minX, worldWith) => {
  return Math.floor(
    (x - minX) / worldWith
  )
}

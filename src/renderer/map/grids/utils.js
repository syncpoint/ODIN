import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { getCenter, getWidth } from 'ol/extent'

/**
 * creates a ol LineString
 * @param {[Number, Number]} startPoint Line start
 * @param {[Number, Number]} endPoint Line end
 * @param {Number} visualDepth Number used to calculate the width of a Line
 * @param {String} text Line text to display
 * @param {Function} wrapBack function to use for calculating X-Coordinates back to the inital world
 * @returns {LineString} linestrin feature
 */
export const createLine = (startPoint, endPoint, visualDepth, text, wrapBack) => {
  if (wrapBack) {
    startPoint[0] = wrapBack(startPoint[0])
    endPoint[0] = wrapBack(endPoint[0])
  }
  const feature = new Feature({
    geometry: new LineString([startPoint[0], startPoint[1], endPoint[0], endPoint[1]], 'XY'),
    detail: visualDepth,
    text: text
  })
  return feature
}

/**
 * cuts extent into <= two extents for each world the view is in
 * @param {[Number, Number, Number, Number]} extent view Extent
 * @param {Object} projection view projection
 * @returns {[[Number, Number, Number, Number],[Number, Number, Number, Number]]} array of extent
 */
export const splitWorlds = (extent, projection) => {
  const extents = []
  const projectionExtent = projection.getExtent()
  if (projection.canWrapX() && (extent[0] < projectionExtent[0] || extent[2] >= projectionExtent[2])) {
    const worldWidth = getWidth(projectionExtent)
    const worldsAway1 = getWorldsAway(extent[0], projectionExtent[0], worldWidth)
    const worldsAway2 = getWorldsAway(extent[2], projectionExtent[0], worldWidth)
    if (worldsAway1 !== worldsAway2) {
      const worldsAway = Math.max(worldsAway1, worldsAway2)
      const extent1 = [...extent]
      extent1[0] = projectionExtent[0] + worldsAway * worldWidth + 1
      extents.push(extent1)
      const extent2 = [...extent]
      extent2[2] = projectionExtent[0] + worldsAway * worldWidth - 1
      extents.push(extent2)
    } else {
      extents.push(extent)
    }
  } else {
    extents.push(extent)
  }
  return extents
}
/**
 * transforms the extent to the the centered world
 * the extent can be over multiple worlds (startPoint < -180° || endPoint > 180°)
 * since most libraries can't handle those coordinates they need to be transformed into coordinates that fit into the initial world
 * @param {[Number]} extent view Extent
 * @param {Object} projection view projection
 * @returns {{e: [Number], f: Function}} e: transformed extent,  f: function to transform x coordinates back to the initial world
 */
export const wrapX = (extent, projection) => {
  const projectionExtent = projection.getExtent()
  const center = getCenter(extent)
  if (projection.canWrapX() && (center[0] < projectionExtent[0] || center[0] >= projectionExtent[2])) {
    const worldWidth = getWidth(projectionExtent)
    const worldsAway = getWorldsAway(center[0], projectionExtent[0], worldWidth)
    extent[0] -= worldsAway * worldWidth
    extent[2] -= worldsAway * worldWidth

    const wrapBack = (x) => {
      x += worldsAway * worldWidth
      return x
    }
    return { e: extent, f: wrapBack }
  }
  return { e: extent }
}

const getWorldsAway = (x, minX, worldWith) => {
  return Math.floor(
    (x - minX) / worldWith
  )
}

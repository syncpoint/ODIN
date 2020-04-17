import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { getCenter, getWidth } from 'ol/extent'

export const createLine = (startPoint, endPoint, zIndex, text, wrapBack) => {
  if (wrapBack) {
    startPoint[0] = wrapBack(startPoint[0])
    endPoint[0] = wrapBack(endPoint[0])
  }
  const feature = new Feature({
    geometry: new LineString([startPoint[0], startPoint[1], endPoint[0], endPoint[1]], 'XY'),
    zIndex: zIndex,
    text: text
  })
  return feature
}

/**
 * cuts extent into <= two extents for each world the view is in
 * @param {[Number]} extent view Extent
 * @param {Object} projection view projection
 * @returns {[[Number]]} array of extent
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
 * transforms the extent to World 1
 * @param {[Number]} extent view Extent
 * @param {Object} projection view projection
 * @returns {{e: [Number], f: function}} e: transformed extent,  f: funbction to transform x coordinates back to the projected world
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

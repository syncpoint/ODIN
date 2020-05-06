import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Stroke, Text, Fill } from 'ol/style'
import { bbox, all } from 'ol/loadingstrategy'
import { toLonLat } from 'ol/proj'
import { getGzdGrid as getGzdGridLines } from './gzdZones'
import { getDetailGrid as getDetailGridLines } from './detailZones'
import { toMgrs } from './mgrs'

/**
 * @typedef {Object} Options options for generating the layers
 * @property {[Number,Number]} gzdRes max/min Resolutions for the gzd layer
 * @property {Number[]} detailRes defines the Resolutions of the different detail Layers.
 * it also defines the amout of layers generated (up to 5 detail layers),
 * the first number is the max Resolution for the first detail Layer,
 * the second number is the min Resolution for the first detail Layer and the max Resolution for the second Layer
 * a single Argument generates a 100km Gird
 * @property {Number} zIndex z-Position for the layers
 */

/**
 * Generates the mgrs Grids, each detail level as its own layer
 * @param {Options} options
 * @returns {VectorLayer[]} Array of ol/layer/Vector
 */
const generateMgrsLayers = (options = { gzdRes: [10000, 0], detailRes: [1200, 200, 15], zIndex: 0 }) => {
  const mgrsLayers = []
  const gzdLayer = generateGzdLayer(options)
  mgrsLayers.push(gzdLayer)

  const detailLayers = generateDetailLayers(options)
  mgrsLayers.push(...detailLayers)
  return mgrsLayers
}

/**
 * generates the GzdLayer
 * @param {Options} options
 * @returns {VectorLayer} gzdLayer
 */
const generateGzdLayer = (options) => {
  const gzdSource = new VectorSource({
    loader: () => {
      const features = getGzdGridLines()
      gzdSource.clear()
      gzdSource.addFeatures(features)
    },
    strategy: all,
    wrapX: true
  })
  const gzdLayer = new VectorLayer({
    maxResolution: options.gzdRes[0] || 10000,
    minResolution: options.gzdRes[1] || 0,
    zIndex: options.zIndex || 0,
    source: gzdSource,
    style: styleFunction(gzdTextFunction)
  })
  return gzdLayer
}

/**
 * generates LineString text for the GZD Lines
 * @param {*} geometry LineString feature geometry
 */
const gzdTextFunction = (geometry) => {
  const coords = geometry.getCoordinates()
  const centeredCoords = getCenter(coords)

  // +1 is to counter small inaccuracies
  const mgrs = toMgrs(toLonLat([centeredCoords[0] + 1, centeredCoords[1] + 1]))
  return isHorizontal(coords[0], coords[1]) ? mgrs.substr(2, 1) : mgrs.substr(0, 2)
}

/**
 * generates the detailLayers
 * @param {Options} options
 * @returns {VectorLayer[]} gzdLayer
 */
const generateDetailLayers = (options) => {
  const detailLayers = []
  for (let i = 0; i < options.detailRes.length && i < 6; i++) {
    const detailSource = new VectorSource({
      loader: async (extent, resolution, projection) => {
        const features = getDetailGridLines(extent, projection, i)
        detailSource.clear()
        detailSource.addFeatures(features)
      },
      strategy: bbox,
      wrapX: false
    })
    detailLayers.push(
      new VectorLayer({
        maxResolution: options.detailRes[i],
        minResolution: options.detailRes[i + 1] || 0,
        zIndex: options.zIndex || 0,
        source: detailSource,
        style: styleFunction(getText(i))
      })
    )
  }
  return detailLayers
}

const styleFunction = (textFunction) => (feature) => {
  const styles = new Style({
    stroke: new Stroke({ color: 'rgba(255,0,0,0.4)', width: 5 / feature.get('detail') }),
    text: new Text({
      text: textFunction(feature.getGeometry()),
      font: '20px serif',
      textBaseline: 'ideographic',
      rotateWithView: true,
      backgroundFill: new Fill({ color: 'rgba(255,255,255,0.5)', width: 1 }),
      fill: new Fill({ color: 'rgba(255,0,0,1.0)' }),
      placement: 'point',
      offsetY: 7
    })
  })
  return styles
}

/**
 * generates a function to generate a LineString Text depending on the detail level and the line coordinates
 * @param {Number} depth detail level of the Grid
 */
const getText = (depth) => (geometry) => {
  const coords = geometry.getCoordinates()
  const horizontal = isHorizontal(coords[0], coords[1])
  const centeredCoords = getCenter(coords)

  // +1 is to counter small inaccuracies
  const mgrs = toMgrs(toLonLat([centeredCoords[0] + 1, centeredCoords[1] + 1]))
  const text = horizontal ? mgrs.substr(10, depth) : mgrs.substr(5, depth)
  // 100k names
  if (depth === 0 || Number(text) === 0) {
    return horizontal ? mgrs.substr(4, 1) : mgrs.substr(3, 1)
  }
  return text
}
/**
 * rearranges the coords withing the array so the startPoint is first
 * @param {[[Number,Number],[Number,Number]]} coords LineString Coordinates
 */
const sortCoords = (coords) => {
  if (isHorizontal(coords[0], coords[1])) {
    return coords[0][0] < coords[1][0] ? coords : [coords[1], coords[0]]
  }
  return coords[0][1] < coords[1][1] ? coords : [coords[1], coords[0]]
}

/**
 * the centered Coodrinates can only be used by horizontal lines.
 * since on the GZD border a centered coordinate would result in a different Segment,
 * if the horizontal step is lower as half the vertical step
 *
 * so the function returns the center of the line for a vertical line
 * @param {*} coords
 * @returns {[Number,number]} for a horizontal line it returns the center of the segment, for a vertical line it returns the center of the Line
 */
const getCenter = (coords) => {
  const sortedCoords = sortCoords(coords)
  const eastingDiff = Math.abs(sortedCoords[0][0] - sortedCoords[1][0])
  const northingDiff = Math.abs(sortedCoords[0][1] - sortedCoords[1][1])
  if (eastingDiff > northingDiff) {
    return [sortedCoords[0][0] + eastingDiff / 2, sortedCoords[0][1] + eastingDiff / 2]
  }
  return [sortedCoords[0][0] + eastingDiff / 2, sortedCoords[0][1] + northingDiff / 2]

}

const isHorizontal = (start, end) => {
  const eastingDiff = Math.abs(start[0] - end[0])
  const northingDiff = Math.abs(start[1] - end[1])
  return eastingDiff > northingDiff
}

export default generateMgrsLayers

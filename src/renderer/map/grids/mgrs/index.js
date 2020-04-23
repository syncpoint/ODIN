import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Stroke, Text, Fill } from 'ol/style'
import { bbox, all } from 'ol/loadingstrategy'
import { getGzdGrid as getGzdGridLines } from './gzdZones'
import { getDetailGrid as getDetailGridLines } from './detailZones'

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
const generateMgrsLayers = (options = { gzdRes: [10000, 0], detailRes: [1200, 250, 20], zIndex: 0 }) => {
  const mgrsLayers = []
  const gzdLayer = generateGzdLayer(options)
  mgrsLayers.push(gzdLayer)

  const detailLayers = generateDetailLayers(options)
  mgrsLayers.push(...detailLayers)
  return mgrsLayers
}


const styleFunction = (feature) => {
  const styles = new Style({
    stroke: new Stroke({ color: 'rgba(255,0,0,0.4)', width: 5 / feature.values_.detail }),
    text: new Text({
      text: feature.values_.text,
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
    style: styleFunction
  })
  return gzdLayer
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
        style: styleFunction
      })
    )
  }
  return detailLayers
}

export default generateMgrsLayers

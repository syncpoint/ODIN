import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Stroke, Text, Fill } from 'ol/style'
import { bbox, all } from 'ol/loadingstrategy'
import { getGzdGrid as getGzdGridLines } from './gzdZones'
import { getDetailGrid as getDetailGridLines } from './detailZones'

/**
 * Generates the mgrs Grids, each detail level as its own layer
 * @param {Object} options options for generating the layers
 * @param {[Number,Number]} options.gzdRes max/min Resolutions for the gzd layer
 * @param {Number[]} options.detailRes defines the Resolutions of the different detail Layers.
 * the first number is the max Resolution for the first detail Layer,
 * the second number is the min Resolution for the first detail Layer and the max Resolution for the second Layer
 * it also defines the amout of layers generated (up to 5 detail layers),
 * a single Argument generates a 100km Gird
 * @param {Number} options.zIndex z-Position for the layers
 * @returns {VectorLayer[]} Array of ol/layer/Vector
 */
const generateMgrsLayers = (options = { gzdRes: [10000, 0], detailRes: [1200, 250, 20], zIndex: 0 }) => {
  const mgrsLayers = []
  const gzdSource = new VectorSource({
    loader: () => {
      const features = getGzdGridLines()
      gzdSource.clear()
      gzdSource.addFeatures(features)
    },
    strategy: all,
    wrapX: true
  })
  mgrsLayers.push(
    new VectorLayer({
      maxResolution: options.gzdRes[0] || 10000,
      minResolution: options.gzdRes[1] || 0,
      zIndex: options.zIndex || 0,
      source: gzdSource,
      style: styleFunction
    })
  )
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
    mgrsLayers.push(
      new VectorLayer({
        maxResolution: options.detailRes[i],
        minResolution: options.detailRes[i + 1] || 0,
        zIndex: options.zIndex || 0,
        source: detailSource,
        style: styleFunction
      })
    )
  }
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

export default generateMgrsLayers

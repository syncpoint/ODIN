import { Tile } from 'ol/layer'
import { OSM } from 'ol/source'

/**
 *
 */
const tileSource = (url, devicePixelRatio) => new OSM({
  // url: url.replace(/{ratio}/, devicePixelRatio === 2 ? '@2x' : ''),
  tilePixelRatio: devicePixelRatio
})


/**
 *
 */
export const tileLayer = url => {
  const layer = new Tile({ source: tileSource(url, window.devicePixelRatio) })

  // Update tile source when device pixel ratio changes:
  matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addListener(() => {
    layer.setSource(tileSource(url, window.devicePixelRatio))
  })

  return layer
}

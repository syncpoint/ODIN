import { Tile } from 'ol/layer'
import { OSM } from 'ol/source'

/**
 *
 */
const url = 'http://localhost:32768/styles/osm-bright/{z}/{x}/{y}{ratio}.png'
const tileSource = devicePixelRatio => new OSM({
  // url: url.replace(/{ratio}/, devicePixelRatio === 2 ? '@2x' : ''),
  tilePixelRatio: devicePixelRatio
})


/**
 *
 */
export const tileLayer = () => {
  const layer = new Tile({ source: tileSource(window.devicePixelRatio) })

  // Update tile source when device pixel ratio changes:
  matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addListener(() => {
    layer.setSource(tileSource(url, window.devicePixelRatio))
  })

  return layer
}

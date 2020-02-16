import Mousetrap from 'mousetrap'
import { Heatmap } from 'ol/layer'

const sidc = feature => feature.getProperties().sidc

export const heatmap = map => source => {
  let attached = false

  const heatmap = (color, weight) => new Heatmap({
    source,
    radius: 50,
    blur: 20,
    gradient: ['#fff', color],
    opacity: 0.5,
    weight
  })

  const eny = heatmap('#FF3031', f => sidc(f).match(/SHG.U/) ? 1 : 0)
  const own = heatmap('#00A8DC', f => sidc(f).match(/SFG.U/) ? 1 : 0)
  const layers = map.getLayers()

  Mousetrap.bind('h', () => {
    attached = !attached
    if (attached) {
      layers.insertAt(1, own)
      layers.insertAt(1, eny)
    } else {
      map.removeLayer(eny)
      map.removeLayer(own)
    }
  })
}

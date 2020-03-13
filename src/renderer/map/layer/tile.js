import { Tile as TileLayer } from 'ol/layer'
import { OSM } from 'ol/source'

export const tile = () => new TileLayer({
  source: new OSM()
})

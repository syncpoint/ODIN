import { from } from './tileSources'
import { Tile as TileLayer } from 'ol/layer'

/*
  This should be used for simple maps only (i.e. preview).
*/
export const clearBasemap = map => {
  if (!map) return
  const layers = map.getLayers()
  const rootLayer = layers.item(0)
  if (rootLayer && rootLayer instanceof TileLayer) {
    return map.getLayers().removeAt(0)
  }
}

/*
  This should be used for simple maps only (i.e. preview).
*/
export const setBasemap = async (map, sourceDescriptor) => {
  if (!map) return
  const source = await from(sourceDescriptor)
  const baseLayer = new TileLayer({ source: source })
  const layers = map.getLayers()
  const rootLayer = layers.item(0)
  if (rootLayer && rootLayer instanceof TileLayer) {
    return map.getLayers().setAt(0, baseLayer)
  }
  layers.insertAt(0, baseLayer)
}

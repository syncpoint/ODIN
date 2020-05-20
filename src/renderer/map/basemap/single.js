import { from } from './tileSources'
import { Tile as TileLayer } from 'ol/layer'

export const clearBasemap = map => {
  if (!map) return
  const layers = map.getLayers()
  const rootLayer = layers.item(0)
  if (rootLayer && rootLayer instanceof TileLayer) {
    return map.getLayers().removeAt(0)
  }
}

export const setBasemap = async (map, sourceDescriptor) => {
  if (!map) return
  const source = await from(sourceDescriptor)
  const baseLayer = new TileLayer({ source: source })

  /*
    We need to verify if the basemap layer is already
    present and replace or insert it. Our naive approach is
    to assume that the basemap is an instance of TileLayer
    (vs VectorLayer). As long as we do not support VectorTileLayer
    this is sufficient.

    Due to the lifecycle of the map and the project
    this may be done twice:

    When the map react component gets mounted for the first
    time the constructor is called AND the project fires the
    'OPEN' event.
    We need to call 'fromPreferences()' in the constructor AND
    on the project's 'open' event because when the map component
    gets unmounted/remounted, the project stays open and will
    not fire again.

    TODO: Verify if this affects performance and we need to
          add an additional check in order to skip this step
          if the source has not changed.
  */
  const layers = map.getLayers()
  const rootLayer = layers.item(0)
  if (rootLayer && rootLayer instanceof TileLayer) {
    return map.getLayers().setAt(0, baseLayer)
  }
  layers.insertAt(0, baseLayer)
}

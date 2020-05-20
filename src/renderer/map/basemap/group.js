import LayerGroup from 'ol/layer/Group'
import TileLayer from 'ol/layer/Tile'
import { from, listSourceDescriptors } from './tileSources'
import preferences from '../../project/preferences'


const KEYS = {
  ODIN_LAYER_ID: 'ODIN_LAYER_ID',
  ODIN_LAYER_NAME: 'ODIN_LAYER_NAME'
}

let reducers = []

const emit = event => {
  reducers.forEach(reducer => setImmediate(() => reducer(event)))
}

const ACTIONS = {
  noop: () => {},
  emit: () => emit({ type: 'basemapLayersChanged', value: getBasemapLayers() }),
  persistAndEmit: () => {
    const layers = getBasemapLayers()
    preferences.set('basemaps', layers)
    emit(
      { type: 'basemapLayersChanged', value: layers }
    )
  }
}

const addTileLayers = async (group, onSuccess = ACTIONS.emit) => {

  const buildLayerFromSource = async source => {
    try {
      const tileSource = await from(source)
      if (tileSource) {
        const layer = new TileLayer({
          source: tileSource,
          visible: false
        })
        layer.set(KEYS.ODIN_LAYER_ID, source.id)
        layer.set(KEYS.ODIN_LAYER_NAME, source.name)
        return layer
      }
    } catch (error) {
      console.error(`error creating tile source for ${source.name}: ${error.message}`)
      return null
    }
  }

  const sources = await listSourceDescriptors()
  const layers = basemapLayerGroup.getLayers()
  await Promise
    .all(sources.map(buildLayerFromSource))
    .then(tileLayers => {
      tileLayers.forEach(layer => layers.push(layer))
    })
    .then(() => onSuccess())
    .catch(error => {
      console.error(error)
    })
}

const layerById = layerId => {
  const layers = basemapLayerGroup.getLayers().getArray()
  return layers.find(l => l.get(KEYS.ODIN_LAYER_ID) === layerId)
}

/**
 * @returns an array of layers. The first layer is the one that is the one furthest
 * away from the user, the layer at the end of the array is the one that is nearest to the user.
 * If layer 1 and layer 0 are visible layer 1 will be above layer 0.
 */
const getBasemapLayers = () => {
  const layers = basemapLayerGroup.getLayers()
  return layers.getArray().map(layer => (
    {
      id: layer.get(KEYS.ODIN_LAYER_ID),
      name: layer.get(KEYS.ODIN_LAYER_NAME),
      visible: layer.getVisible(),
      opacity: layer.getOpacity()
    }
  ))
}

const setVisibility = (layerId, visible, onSuccess = ACTIONS.persistAndEmit) => {
  if (!layerId || visible === undefined) return
  const layer = layerById(layerId)
  if (!layer) return
  layer.setVisible(visible)
  onSuccess()
}

export const toggleVisibility = (layerId, onSuccess = ACTIONS.persistAndEmit) => {
  const layer = layerById(layerId)
  if (!layer) return
  setVisibility(layerId, !layer.getVisible(), onSuccess)
}

/**
 *
 * @param {*} layerIds array of layer ids
 */
export const setZIndices = (layerIds, onSuccess = ACTIONS.persistAndEmit) => {
  if (!layerIds || layerIds.length === 0) return
  const shadow = []
  layerIds.forEach((layerId) => {
    shadow.push(layerById(layerId))
  })
  const layers = basemapLayerGroup.getLayers()
  layers.clear()
  shadow.forEach(layer => layers.push(layer))
  onSuccess()
}

export const register = reducer => {
  reducers = [...reducers, reducer]
  reducer({ type: 'basemapLayersChanged', value: getBasemapLayers() })
}

export const deregister = reducer => {
  reducers = reducers.filter(x => x !== reducer)
}

const basemapLayerGroup = new LayerGroup()
basemapLayerGroup.set(KEYS.ODIN_LAYER_ID, 'basemap')


const initByPreferences = async event => {
  if (event.type !== 'preferences') return
  await addTileLayers(basemapLayerGroup.getLayers(), () => {})

  const basemaps = (event.preferences.basemaps ? event.preferences.basemaps : [])
  /* preferences.once would be nice */
  preferences.deregister(initByPreferences)
  if (!basemaps || basemaps.length === 0) return

  setZIndices(basemaps.map(basemap => basemap.id), ACTIONS.noop)
  basemaps.forEach(basemap => setVisibility(basemap.id, basemap.visible, ACTIONS.noop))

  ACTIONS.emit()
}

preferences.register(initByPreferences)

export default () => basemapLayerGroup

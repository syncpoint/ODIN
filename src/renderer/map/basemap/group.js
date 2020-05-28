import LayerGroup from 'ol/layer/Group'
import TileLayer from 'ol/layer/Tile'
import {
  from,
  register as onSourcesChanged,
  DEFAULT_SOURCE_DESCRIPTOR
} from './tileSources'

import preferences from '../../project/preferences'


const KEYS = {
  ODIN_LAYER_ID: 'ODIN_LAYER_ID',
  ODIN_LAYER_NAME: 'ODIN_LAYER_NAME'
}

/* event API */
let reducers = []

export const register = reducer => {
  reducers = [...reducers, reducer]
  reducer({ type: 'basemapLayersChanged', value: getBasemapLayers() })
}

export const deregister = reducer => {
  reducers = reducers.filter(x => x !== reducer)
}

const emit = event => {
  reducers.forEach(reducer => setImmediate(() => reducer(event)))
}

/*
  Since we need to
  * apply persisted preferences
  * persist preferences on change
  there are some actions we can execute after a change was made:
*/
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

const addTileLayers = async (group, sources, onSuccess = ACTIONS.emit) => {

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

  // const sources = await listSourceDescriptors()
  const layers = group.getLayers()
  layers.clear()
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

export const setOpacity = (layerId, opacity, onSuccess = ACTIONS.persistAndEmit) => {
  if (!layerId || opacity === undefined) return
  const layer = layerById(layerId)
  if (!layer) return
  layer.setOpacity(opacity)
  onSuccess()
}

/**
 *
 * @param {*} layerIds array of layer ids that define the order of the tile layers
 */
export const setZIndices = (layerIds, onSuccess = ACTIONS.persistAndEmit) => {
  if (!layerIds || layerIds.length === 0) return

  const layers = basemapLayerGroup.getLayers()
  const shadow = new Map()
  layers.getArray().forEach(layer => {
    shadow.set(layer.get(KEYS.ODIN_LAYER_ID), layer)
  })
  layers.clear()

  /* insert the layers defined by the order of the layerIds */
  layerIds.forEach(layerId => {
    const layer = shadow.get(layerId)
    if (layer) {
      layers.push(layer)
      shadow.delete(layerId)
    }
  })

  /*
    If there are layers that are not affected by the given order
    we just add them in no order at the end of the collection.
  */
  shadow.forEach(layer => layers.push(layer))
  onSuccess()
}

const basemapLayerGroup = new LayerGroup()
basemapLayerGroup.set(KEYS.ODIN_LAYER_ID, 'basemap')

const init = async sourceDescriptors => {
  await addTileLayers(
    basemapLayerGroup,
    sourceDescriptors,
    ACTIONS.noop
  )

  const basemaps = preferences.get('basemaps') || []
  if (basemaps.length > 0) {
    setZIndices(basemaps.map(basemap => basemap.id), ACTIONS.noop)
    basemaps.forEach(basemap => {
      setVisibility(basemap.id, basemap.visible, ACTIONS.noop)
      setOpacity(basemap.id, basemap.opacity, ACTIONS.noop)
    })
    ACTIONS.emit()
  } else {
    /*
      If there are no preferences (i.e. when we start a new project)
      we should at least show the default layer.
      This will trigger an implicit persist and emit event
    */
    setVisibility(DEFAULT_SOURCE_DESCRIPTOR.id, true)
  }
}

onSourcesChanged(event => {
  init(event.value)
})

export default () => basemapLayerGroup

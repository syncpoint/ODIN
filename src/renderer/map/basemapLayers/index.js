import LayerGroup from 'ol/layer/Group'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'

import { ipcRenderer } from 'electron'

const KEYS = {
  ODIN_LAYER_ID: 'ODIN_LAYER_ID',
  ODIN_LAYER_NAME: 'ODIN_LAYER_NAME'
}

const DEFAULT_SOURCE_DESCRIPTOR = {
  name: 'Open Street Map',
  type: 'OSM',
  id: '708b7f83-12a2-4a8b-a49d-9f2683586bcf'
}

/*
  Internal event based API
*/

let reducers = []

const emit = event => {
  reducers.forEach(reducer => setImmediate(() => reducer(event)))
}

const sources = {
  OSM: descriptor => new OSM(descriptor.options),
  XYZ: descriptor => new XYZ(descriptor.options),
  WMTS: async descriptor => {
    const response = await fetch(descriptor.options.url)
    const capabilities = (new WMTSCapabilities()).read(await response.text())
    const wmtsOptions = optionsFromCapabilities(capabilities, descriptor.options)
    // wmtsOptions.tilePixelRatio = (highDPI ? 2 : 1)
    return new WMTS(wmtsOptions)
  }
}

const from = async descriptor => {
  const fallbackSource = () => null
  try {
    return (sources[descriptor.type] || fallbackSource)(descriptor)
  } catch (error) {
    console.error(error)
    return fallbackSource()
  }
}

export const listSourceDescriptors = async () => {
  /*
    Handling the resources (file) required is done by the
    main process via the 'main/ipc/sources' module.
  */
  const sourceDescriptors = await ipcRenderer.invoke('IPC_LIST_SOURCE_DESCRIPTORS')
  return [...sourceDescriptors, ...[DEFAULT_SOURCE_DESCRIPTOR]]
}

const addTileLayers = async (group) => {

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
    .then(() => {
      emit(
        { type: 'basemapLayersChanged', value: getBasemapLayers() }
      )
    })
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

export const toggleVisibility = layerId => {
  if (!layerId) return
  const layer = layerById(layerId)
  if (!layer) return
  layer.setVisible(!layer.getVisible())
  emit(
    { type: 'basemapLayersChanged', value: getBasemapLayers() }
  )
}

/**
 *
 * @param {*} layerIds array of layer ids
 */
export const setZIndices = layerIds => {
  if (!layerIds || layerIds.length === 0) return
  const shadow = []
  layerIds.forEach((layerId, index) => {
    const layer = layerById(layerId)
    shadow.push(layer)
  })
  const layers = basemapLayerGroup.getLayers()
  layers.clear()
  shadow.forEach(layer => layers.push(layer))
  emit(
    { type: 'basemapLayersChanged', value: getBasemapLayers() }
  )
}

export const register = reducer => {
  reducers = [...reducers, reducer]
  // setImmediate(() => reducer({ type: 'basemapLayersChanged', value: getBasemapLayers() }))
  reducer({ type: 'basemapLayersChanged', value: getBasemapLayers() })
}

export const deregister = reducer => {
  reducers = reducers.filter(x => x !== reducer)
}

const basemapLayerGroup = new LayerGroup()
basemapLayerGroup.set(KEYS.ODIN_LAYER_ID, 'basemap')
addTileLayers(basemapLayerGroup.getLayers())


export default () => basemapLayerGroup

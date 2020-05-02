import { Tile as TileLayer } from 'ol/layer'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { DEVICE_PIXEL_RATIO } from 'ol/has'

import { ipcRenderer } from 'electron'
import project from '../project'
/* extends OL's projection definitions */
import './epsg'

const highDPI = DEVICE_PIXEL_RATIO > 1

const DEFAULT_SOURCE_DESCRIPTOR = {
  name: 'Open Street Map',
  type: 'OSM'
}

/* set by constructor */
let olMap = null

export const clearBasemap = () => {
  if (!olMap) throw new Error('Not initialized! Call constructor with OpenLayers first!')

  const layers = olMap.getLayers()
  const rootLayer = layers.item(0)
  if (rootLayer && rootLayer instanceof TileLayer) {
    olMap.getLayers().removeAt(0)
  }
}

export const setBasemap = async sourceDescriptor => {
  if (!olMap) throw new Error('Not initialized! Call constructor with OpenLayers first!')

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
  const layers = olMap.getLayers()
  const rootLayer = layers.item(0)
  if (rootLayer && rootLayer instanceof TileLayer) {
    return olMap.getLayers().setAt(0, baseLayer)
  }
  layers.insertAt(0, baseLayer)
}

/*
  This is a factory function that takes a source descriptor and returns
  a OpenLayer source that can be used with OpenLayers Tile Layers.
*/
const from = async (sourceDescriptor) => {
  if (!sourceDescriptor || !sourceDescriptor.type) return new OSM(DEFAULT_SOURCE_DESCRIPTOR)

  const fromWMTS = async descriptor => {
    try {
      const response = await fetch(descriptor.options.url)
      const capabilities = (new WMTSCapabilities()).read(await response.text())
      const wmtsOptions = optionsFromCapabilities(capabilities, descriptor.options)
      wmtsOptions.tilePixelRatio = (highDPI ? 2 : 1)
      return new WMTS(wmtsOptions)
    } catch (error) {
      console.error(error)
    }
  }

  switch (sourceDescriptor.type) {
    case 'OSM': {
      return new OSM(sourceDescriptor.options)
    }
    case 'WMTS': {
      return await fromWMTS(sourceDescriptor)
    }
    case 'XYZ': {
      return new XYZ(sourceDescriptor.options)
    }
    default: {
      console.error(`unknown source type: ${sourceDescriptor.type}`)
      return new OSM(DEFAULT_SOURCE_DESCRIPTOR)
    }
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

const descriptorFromPreferences = () => {
  return project.preferences().basemap
}

const handleProjectLifecycle = action => {
  if (action !== 'open') return
  setBasemap(descriptorFromPreferences())
}

project.register(handleProjectLifecycle)

export default map => {
  olMap = map
}

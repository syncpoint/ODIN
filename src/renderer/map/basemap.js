import { ipcRenderer } from 'electron'
import { Tile as TileLayer } from 'ol/layer'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { DEVICE_PIXEL_RATIO } from 'ol/has'

import preferences from '../project/preferences'
import './epsg'

const highDPI = DEVICE_PIXEL_RATIO > 1

const DEFAULT_SOURCE_DESCRIPTOR = {
  name: 'Open Street Map',
  type: 'OSM'
}

/*
  This is a factory function that takes a source descriptor and returns
  a OpenLayer source that can be used with OpenLayers Tile Layers.
*/

const sources = {
  OSM: descriptor => new OSM(descriptor.options),
  XYZ: descriptor => new XYZ(descriptor.options),
  WMTS: async descriptor => {
    const response = await fetch(descriptor.options.url)
    const capabilities = (new WMTSCapabilities()).read(await response.text())
    const wmtsOptions = optionsFromCapabilities(capabilities, descriptor.options)
    wmtsOptions.tilePixelRatio = (highDPI ? 2 : 1)
    return new WMTS(wmtsOptions)
  }
}

const from = async descriptor => {
  const fallbackSource = () => new OSM(DEFAULT_SOURCE_DESCRIPTOR)

  if (!descriptor) return fallbackSource()
  if (!descriptor.type) return fallbackSource()

  return (sources[descriptor.type] || fallbackSource)(descriptor)
}

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

export const listSourceDescriptors = async () => {
  /*
    Handling the resources (file) required is done by the
    main process via the 'main/ipc/sources' module.
  */
  const sourceDescriptors = await ipcRenderer.invoke('IPC_LIST_SOURCE_DESCRIPTORS')
  return [...sourceDescriptors, ...[DEFAULT_SOURCE_DESCRIPTOR]]
}


export default map => {
  const reducer = ({ type, preferences }) => {
    switch (type) {
      case 'preferences': setBasemap(map, preferences.basemap)
    }
  }

  preferences.register(reducer)
}

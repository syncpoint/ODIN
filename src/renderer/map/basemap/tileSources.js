import { ipcRenderer } from 'electron'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { DEVICE_PIXEL_RATIO } from 'ol/has'

import '../epsg'

const highDPI = DEVICE_PIXEL_RATIO > 1

export const DEFAULT_SOURCE_DESCRIPTOR = Object.freeze({
  name: 'Open Street Map',
  type: 'OSM',
  id: '708b7f83-12a2-4a8b-a49d-9f2683586bcf'
})

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
    wmtsOptions.crossOrigin = 'anonymous'
    return new WMTS(wmtsOptions)
  }
}

export const from = async descriptor => {
  const fallbackSource = () => new OSM(DEFAULT_SOURCE_DESCRIPTOR)

  if (!descriptor) return fallbackSource()
  if (!descriptor.type) return fallbackSource()
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


/* event API */
let reducers = []

export const register = reducer => {
  reducers = [...reducers, reducer]
  listSourceDescriptors()
    .then(sourceDescriptors => {
      reducer({ type: 'sourceDescriptors', value: sourceDescriptors })
    })
}

export const deregister = reducer => {
  reducers = reducers.filter(x => x !== reducer)
}

const emit = event => {
  reducers.forEach(reducer => reducer(event))
}

ipcRenderer.on('IPC_SOURCE_DESCRIPTORS_CHANGED', (event, sourceDescriptors) => {
  emit({
    type: 'sourceDescriptors', value: [...sourceDescriptors, ...[DEFAULT_SOURCE_DESCRIPTOR]]
  })
})

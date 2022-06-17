import { ipcRenderer } from 'electron'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import TileWMS from 'ol/source/TileWMS'
import WMSCapabilities from 'ol/format/WMSCapabilities'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { DEVICE_PIXEL_RATIO } from 'ol/has'
import { fetcher, urlToBasicAuth } from '../../components/basemap/tools'

import '../epsg'

const highDPI = DEVICE_PIXEL_RATIO > 1

export const DEFAULT_SOURCE_DESCRIPTOR = Object.freeze({
  name: 'Open Street Map',
  type: 'OSM',
  id: '708b7f83-12a2-4a8b-a49d-9f2683586bcf',
  attributions: '<a href="openstreetmap.org">OpenStreetMap</a> contributors'
})

const wmsOptionsFromDescriptor = descriptor => {
  const wmsServerUrl = new URL(descriptor.options.url)
  return {
    url: `${wmsServerUrl.origin}${wmsServerUrl.pathname}${wmsServerUrl.search}`,
    params: {
      LAYERS: descriptor.options.layer
    },
    crossOrigin: 'anonymous'
  }
}

const basicAuthTileLoadFunction = (authorizationHeader) => {
  return function (imageTile, src) {
    const fetchUrl = new URL(src)
    const headers = new Headers()
    headers.set('Authorization', authorizationHeader)
    fetch(`${fetchUrl.origin}${fetchUrl.pathname}${fetchUrl.search}`, { headers })
      .then(response => response.blob())
      .then(blob => {
        const imageUrl = URL.createObjectURL(blob)
        imageTile.getImage().src = imageUrl
      })
  }
}

/*
  This is a factory function that takes a source descriptor and returns
  a OpenLayer source that can be used with OpenLayers Tile Layers.
*/

const sources = {
  OSM: descriptor => new OSM(descriptor.options),
  XYZ: descriptor => {
    const options = { ...descriptor.options }
    const { authorization } = urlToBasicAuth(options.url)
    if (authorization) {
      options.tileLoadFunction = basicAuthTileLoadFunction(authorization)
    }
    return new XYZ(options)
  },
  WMTS: async descriptor => {
    const response = await fetcher(descriptor.options.url)
    const capabilities = (new WMTSCapabilities()).read(await response.text())
    const wmtsOptions = optionsFromCapabilities(capabilities, descriptor.options)
    wmtsOptions.tilePixelRatio = (highDPI ? 2 : 1)
    wmtsOptions.crossOrigin = 'anonymous'
    wmtsOptions.attributions = descriptor.options.attributions

    const { authorization } = urlToBasicAuth(descriptor.options.url)
    if (authorization) {
      wmtsOptions.tileLoadFunction = basicAuthTileLoadFunction(authorization)
    }

    return new WMTS(wmtsOptions)
  },
  WMS: async descriptor => {
    const response = await fetcher(descriptor.options.url)
    const capabilities = (new WMSCapabilities()).read(await response.text())
    console.dir(capabilities)
    const options = wmsOptionsFromDescriptor(descriptor)

    const { authorization } = urlToBasicAuth(descriptor.options.url)
    if (authorization) {
      options.tileLoadFunction = basicAuthTileLoadFunction(authorization)
    }

    return new TileWMS(options)
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

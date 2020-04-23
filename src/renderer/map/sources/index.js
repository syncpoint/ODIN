import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { DEVICE_PIXEL_RATIO } from 'ol/has'

import { ipcRenderer } from 'electron'

const DEFAULT_SOURCE = {
  name: 'Open Street Map',
  type: 'OSM'
}

const highDPI = DEVICE_PIXEL_RATIO > 1
const defaultSource = () => from(DEFAULT_SOURCE)

const fromWMTS = async (source) => {
  try {
    const response = await fetch(source.url)
    const capabilities = (new WMTSCapabilities()).read(await response.text())
    const wmtsOptions = optionsFromCapabilities(capabilities, source.options)
    wmtsOptions.tilePixelRatio = (highDPI ? 2 : 1)
    return new WMTS(wmtsOptions)
  } catch (error) {
    console.error(error)
  }
}

const from = async (source) => {
  switch (source.type) {
    case 'OSM': {
      return new OSM(source.options)
    }
    case 'WMTS': {
      const wmtsSource = await fromWMTS(source)
      return wmtsSource
    }
    case 'XYZ': {
      return new XYZ(source.options)
    }
    default: {
      console.error(`unknown source type: ${source.type}`)
      return defaultSource()
    }
  }
}

const listSources = async () => {
  /*
    Handling the resources (file) required is done by the
    main process via the 'main/ipc/sources' module.
  */
  const sources = await ipcRenderer.invoke('IPC_LIST_SOURCES')
  return [...sources, ...[DEFAULT_SOURCE]]
}

export {
  defaultSource,
  listSources,
  from
}

import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { DEVICE_PIXEL_RATIO } from 'ol/has'

import { app, remote } from 'electron'
import fs from 'fs'
import path from 'path'

const HOME = remote ? remote.app.getPath('home') : app.getPath('home')
const ODIN_HOME = path.join(HOME, 'ODIN')
const ODIN_SOURCES = path.join(ODIN_HOME, 'sources.json')

const DEFAULT_SOURCE = {
  name: 'Open Street Map',
  type: 'OSM'
}

const highDPI = DEVICE_PIXEL_RATIO > 1
const defaultSource = () => from(DEFAULT_SOURCE)

const listSources = async () => {
  if (!fs.existsSync(ODIN_SOURCES)) return [DEFAULT_SOURCE]

  const sources = await fs.promises.readFile(ODIN_SOURCES, 'utf-8')
  return JSON.parse(sources)
}

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



export {
  defaultSource,
  listSources,
  from
}

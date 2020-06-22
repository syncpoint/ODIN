import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { layerAbstract } from './tools'

const capabilitiesFromContent = content => {
  return (new WMTSCapabilities()).read(content)
}

const crs = (capabilities, layerId) => {
  let providedCRS = []
  const layer = capabilities.Contents.Layer.find(l => l.Identifier === layerId)
  if (!layer) return providedCRS
  layer.TileMatrixSetLink.forEach(link => {
    providedCRS = providedCRS.concat(
      capabilities.Contents.TileMatrixSet
        .filter(tms => tms.Identifier === link.TileMatrixSet)
        .map(matrixSet => ({ Identifier: matrixSet.Identifier, SupportedCRS: matrixSet.SupportedCRS }))
    )
  })
  return providedCRS
}

const layers = capabilities => {
  return capabilities.Contents.Layer.map(layer => {
    return {
      Identifier: layer.Identifier,
      Title: layer.Title,
      Abstract: layerAbstract(layer)
    }
  })
}

const wgs84BoundingBox = (capabilites, layerId) => {
  const layer = capabilites.Contents.Layer.find(l => l.Identifier === layerId)
  if (!layer) return null
  return layer.WGS84BoundingBox
}


export default {
  capabilitiesFromContent,
  crs,
  layers,
  wgs84BoundingBox
}

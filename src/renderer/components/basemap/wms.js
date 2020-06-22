import WMSCapabilities from 'ol/format/WMSCapabilities'
import { layerAbstract } from './tools'

const capabilitiesFromContent = content => {
  const caps = (new WMSCapabilities()).read(content)
  if (!caps || !caps.Service || !caps.Capability) return null
  return caps
}

const crs = (capabilities, layerId) => {
  const layer = flattenLayers(capabilities.Capability.Layer.Layer).find(l => l.Name === layerId)
  if (!layer) return []
  return layer.CRS
    .filter(crs => crs.startsWith('EPSG'))
    .map(crs => ({ Identifier: crs, SupportedCRS: crs }))
}

const flattenLayers = layers => {
  return layers.flatMap(layer => layer.Layer ? flattenLayers(layer.Layer) : layer)
}

const layers = capabilities => {
  const root = capabilities.Capability.Layer.Layer
  if (!root) return []
  return flattenLayers(root).map(layer => ({
    Identifier: layer.Name,
    Title: layer.Title,
    Abstract: layerAbstract(layer)
  }))
}

const wgs84BoundingBox = (capabilites, layerId) => {
  const layer = layers(capabilites).find(l => l.Identifier === layerId)
  if (!layer) return null
  return layer.EX_GeographicBoundingBox
}

export default {
  capabilitiesFromContent,
  crs,
  layers,
  wgs84BoundingBox
}

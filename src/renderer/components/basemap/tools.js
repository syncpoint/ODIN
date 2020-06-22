const MAX_ABSTRACT_LENGTH = 140

const layerAbstract = layer => {
  if (!layer.Abstract) return ''
  return layer.Abstract.length > MAX_ABSTRACT_LENGTH
    ? `${layer.Abstract.substring(0, MAX_ABSTRACT_LENGTH)} ...`
    : layer.Abstract
}

export const flattenLayers = layers => {
  return layers.flatMap(layer => layer.Layer ? flattenLayers(layer.Layer) : layer)
}

export const wmsLayer = layers => {
  return flattenLayers(layers).map(layer => ({
    Identifier: layer.Name,
    Title: layer.Title,
    Abstract: layerAbstract(layer)
  }))
}

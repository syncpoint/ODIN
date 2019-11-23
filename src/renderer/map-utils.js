
/**
 *
 */
export const featuresAtPixel = (map, options) => pixel => {
  const reduce = (fn, acc) => {

    // NOTE:
    // Layers are usually added to a map with module:ol/Map#addLayer.
    // Components like module:ol/interaction/Select~Select use unmanaged
    // layers internally. These unmanaged layers are associated with the map
    // using module:ol/layer/Layer~Layer#setMap instead.

    map.forEachFeatureAtPixel(pixel, (feature, layer) => {
      acc = fn(acc, feature, layer)
      return undefined
    }, options)
    return acc
  }

  return reduce((acc, feature) => acc.concat([feature]), [])
}


/**
 *
 */
export const clearFeatues = fast => source => source.clear(fast)


/**
 *
 */
export const addFeatures = append => (source, features) => {
  if (!append) clearFeatues(true)(source)
  source.addFeatures(features)
}

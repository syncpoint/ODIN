
/**
 *
 */
export const featuresAtPixel = (map, options) => pixel => {
  const reduce = (fn, acc) => {
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

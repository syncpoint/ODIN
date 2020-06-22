const MAX_ABSTRACT_LENGTH = 140

export const layerAbstract = layer => {
  if (!layer.Abstract) return ''
  return layer.Abstract.length > MAX_ABSTRACT_LENGTH
    ? `${layer.Abstract.substring(0, MAX_ABSTRACT_LENGTH)} ...`
    : layer.Abstract
}




export const firstOrDefault = (someArray, defaultValue) => {
  if (!Array.isArray(someArray)) return defaultValue
  if (someArray.length > 0) return someArray[0]
  return defaultValue
}

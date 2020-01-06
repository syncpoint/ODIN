export const tacgrp = []

/**
* normalizeSIDC :: String -> String
*/
export const normalizeSIDC = sidc => `${sidc[0]}-${sidc[2]}-${sidc.substring(4, 10)}`

/**
 * editorFeatures :: feature -> feature -> [feature]
 */
export const editorFeatures = feature => {
  const noop = () => []
  const { sidc } = feature.getProperties()
  if (!sidc) return noop
  if (!tacgrp[normalizeSIDC(sidc)]) return noop
  return tacgrp[normalizeSIDC(sidc)].editorFeatures || noop
}


/**
 * selectionFeatures :: feature -> feature -> [feature]
 */
export const selectionFeatures = feature => {
  const noop = () => []
  const { sidc } = feature.getProperties()
  if (!sidc) return noop
  if (!tacgrp[normalizeSIDC(sidc)]) return noop
  return tacgrp[normalizeSIDC(sidc)].selectionFeatures || noop
}

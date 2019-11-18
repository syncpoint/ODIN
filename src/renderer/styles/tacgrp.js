export default []

/**
* normalizeSIDC :: String -> String
*/
export const normalizeSIDC = sidc => `${sidc[0]}-${sidc[2]}-${sidc.substring(4, 10)}`

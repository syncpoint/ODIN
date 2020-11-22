
export const geometryType = geometry => geometry.getType() === 'GeometryCollection'
  ? `[${geometry.getGeometries().map(geometryType).join(',')}]`
  : geometry.getType()

export const normalizeSIDC = sidc => sidc
  ? `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  : undefined


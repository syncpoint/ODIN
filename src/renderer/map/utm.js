import proj4 from 'proj4'

// [EPSG:3857] -> string
export const zone = coordinate => {
  const proj = proj4('EPSG:3857', 'EPSG:4326')
  const [longitude, latitude] = proj.forward(coordinate)
  const zone = Math.ceil((longitude + 180) / 6)
  const south = latitude < 0
  const utmCode = (south ? 32700 : 32600) + zone
  return `EPSG:${utmCode}`
}

export const transform = reference => {
  // NOTE: transform changes coordinates inplace; we clone geometry unconditionally:
  const code = zone(reference)
  return {
    toUTM: geometry => geometry.clone().transform('EPSG:3857', code),
    fromUTM: geometry => geometry.clone().transform(code, 'EPSG:3857')
  }
}

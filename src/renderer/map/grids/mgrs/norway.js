// thanks Norway

export const isSmallNorwayZone = (mgrs) => {
  if (mgrs.zone === 31 && mgrs.band === 'V') {
    return true
  }
  return false
}
export const isXNorwayZones = (mgrs) => {
  if (mgrs.band !== 'X') {
    return false
  }
  if (mgrs.zone === 31 || mgrs.zone === 33 || mgrs.zone === 35 || mgrs.zone === 37) {
    return true
  }
  return false
}

/**
 * function required to get the longitude for GZD points for the weird norway regions
 * @param {number} long longitude for a GZD Point if norway would follow the MGRS Convention
 * @param {number} lat latitude for a GZD Point
 * @param {[number,number]} point point within a GZD Point
 */
export const longitudeGzdNorwayZones = (long, lat, point, isEndPoint) => {
  if ((long === 6 && lat === 64 && isEndPoint) || (long === 0 && lat === 56 && long + 3 < point[0])) {
    long = 3
  } else if ((long === 12 && lat === 80) || (long === 6 && lat === 72 && long + 3 < point[0])) {
    long = 9
  } else if ((long === 24 && lat === 80) || (long === 18 && lat === 72 && long + 3 < point[0]) || (long === 18 && lat === 80)) {
    long = 21
  } else if ((long === 36 && lat === 80) || (long === 30 && lat === 72 && long + 3 < point[0]) || (long === 30 && lat === 80)) {
    long = 33
  }
  return long
}

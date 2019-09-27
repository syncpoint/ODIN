import L from 'leaflet'

const latlng = geometry => {
  const { type, coordinates } = geometry

  switch (type) {
    case 'Point': return L.latLng(coordinates[1], coordinates[0])
    case 'LineString': return coordinates.map(([lon, lat]) => L.latLng(lat, lon))
    // NOTE: first ring only:
    case 'Polygon': return coordinates.map(ring => ring.map(([lon, lat]) => L.latLng(lat, lon)))
  }
}

export default {
  latlng
}

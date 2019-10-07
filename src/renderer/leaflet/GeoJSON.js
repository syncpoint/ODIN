import L from 'leaflet'

export const toLatLngs = geometry => {
  const { type, coordinates } = geometry

  switch (type) {
    case 'Point': return L.latLng(coordinates[1], coordinates[0])
    case 'MultiPoint': return coordinates.map(([lon, lat]) => L.latLng(lat, lon))
    case 'LineString': return coordinates.map(([lon, lat]) => L.latLng(lat, lon))
    case 'Polygon': return coordinates.map(ring => ring.map(([lon, lat]) => L.latLng(lat, lon)))
  }
}

export const toGeometry = (type, latlngs) => {
  const lineString = () => latlngs.map(({ lat, lng }) => [lng, lat])
  const polygon = () => latlngs.map(ring => ring.map(({ lat, lng }) => [lng, lat]))

  switch (type) {
    case 'Point': return { type: 'Point', coordinates: [latlngs.lng, latlngs.lat] }
    // TODO: MultiPoint
    case 'Polygon': return { type: 'Polygon', coordinates: polygon() }
    case 'LineString': return { type: 'LineString', coordinates: lineString() }
  }
}

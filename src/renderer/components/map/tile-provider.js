import L from 'leaflet'
import Leaflet from '../../leaflet'
import mapSettings from './settings'

export const tileProvider = () => {
  const tileProvider = mapSettings.get('tileProvider') || defautTileProvider
  tileProvider.detectRetina = mapSettings.get('hiDPISupport') || false
  return tileProvider
}

const updateTileLayer = map => {
  Leaflet.layers(map)
    .filter(layer => layer instanceof L.TileLayer)
    .forEach(layer => map.removeLayer(layer))
  console.log(tileProvider())
  L.tileLayer(tileProvider().url, tileProvider()).addTo(map)
}

const defautTileProvider = {
  id: 'OpenStreetMap.Mapnik',
  name: 'OpenStreetMap',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
  attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`
}

export const COMMAND_MAP_TILE_PROVIDER = ({ map }) => options => {
  mapSettings.set('tileProvider', options)
  updateTileLayer(map)
}

export const COMMAND_HIDPI_SUPPORT = ({ map }) => () => {
  // NOTE: hiDPISupport aleady updated in map settings (main/menu).
  updateTileLayer(map)
}

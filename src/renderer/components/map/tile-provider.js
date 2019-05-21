import L from 'leaflet'
import Leaflet from '../../leaflet'
import mapSettings from './settings'

export const COMMAND_MAP_TILE_PROVIDER = ({ map }) => options => {
  Leaflet.layers(map)
    .filter(layer => layer instanceof L.TileLayer)
    .forEach(layer => map.removeLayer(layer))
  L.tileLayer(options.url, options).addTo(map)
  mapSettings.set('tileProvider', options)
}

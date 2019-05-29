import mapSettings from './settings'
import L from 'leaflet'
import Leaflet from '../../leaflet'

export const COMMAND_TOGGLE_MAP_VISIBILITY = ({ map }) => options => {
  const tileProvider = mapSettings.get('tileProvider')
  if (!options) {
    Leaflet.layers(map)
      .filter(layer => layer instanceof L.TileLayer)
      .forEach(layer => map.removeLayer(layer))
  } else {
    L.tileLayer(tileProvider.url, tileProvider).addTo(map)
  }
  mapSettings.set('map-is-visible', options)
}

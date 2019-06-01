import L from 'leaflet'
import Leaflet from '../../leaflet'
import settings from './settings'

const defautTileProvider = {
  id: 'OpenStreetMap.Mapnik',
  name: 'OpenStreetMap',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
  attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`
}

const removeTileLayers = map => Leaflet.layers(map)
  .filter(layer => layer instanceof L.TileLayer)
  .forEach(layer => map.removeLayer(layer))

export const tileProvider = () => {
  const tileProvider = settings.tileProvider.get(defautTileProvider)
  tileProvider.detectRetina = settings.hidpi.get()
  return tileProvider
}

const updateTileLayer = map => {
  removeTileLayers(map)
  L.tileLayer(tileProvider().url, tileProvider()).addTo(map)
}

export const COMMAND_MAP_TILE_PROVIDER = ({ map }) => tileProvider => {
  if (!settings.map.visible()) return
  settings.tileProvider.set(tileProvider)
  updateTileLayer(map)
}

export const COMMAND_HIDPI_SUPPORT = ({ map }) => enabled => {
  settings.hidpi.set(enabled)
  updateTileLayer(map)
}

export const COMMAND_TOGGLE_MAP_VISIBILITY = ({ map }) => visible => {
  visible ? settings.map.show() : settings.map.hide()
  if (visible) L.tileLayer(tileProvider().url, tileProvider()).addTo(map)
  else removeTileLayers(map)
}

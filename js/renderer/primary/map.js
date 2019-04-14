const { ipcRenderer, clipboard } = require('electron')
const Leaflet = require('../common/leaflet')
const { displayFilter, mapViewport } = require('./user-settings')
const { K } = require('../../shared/predef')

const applyDisplayFilters = map => values => {
  const styles = Leaflet.panes(layer => layer instanceof L.TileLayer)(map).map(pane => pane.style)
  const filter = Object.entries(values)
    .map(([name, {value, unit}]) => `${name}(${value}${unit})`)
    .join(' ')

  styles.forEach(style => style.filter = filter)
}

const focus = container => () => container.focus()

const options = {
  attributionControl: false,
  zoomControl: false,
  boxZoom: true,
  center: L.latLng(48.65400545105681, 15.319061279296877),
  zoom: 13,
  attributionControl: true
}

    // local
    // 'http://maps.einsappl.net/styles/positron/{z}/{x}/{y}.png',
    // 'http://maps.einsappl.net/styles/osm-bright/{z}/{x}/{y}.png',
    // 'http://maps.einsappl.net/styles/klokantech-basic/{z}/{x}/{y}.png',
    // 'http://maps.einsappl.net/styles/dark-matter/{z}/{x}/{y}.png'

const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  id: 'OpenStreetMap.Mapnik',
  detectRetina: false
})

const container = document.getElementsByClassName('odin-map')[0]

const map = K(L.map(container, options))(map => {
  tileLayer.addTo(map)
  map.on('moveend', () => {
    const {lat, lng} = map.getCenter()
    const viewport = { lat, lng, zoom: map.getZoom() }
    mapViewport.write(viewport)
  })

  mapViewport.read().then(viewport => {
    if(!viewport) return
    map.setView(L.latLng(viewport.lat, viewport.lng), viewport.zoom)
  })
})

// Pick/copy coordinate to clipboard
;(() => {
  const pickMode = event => event.ctrlKey && event.shiftKey
  const cursor = event => pickMode(event) ? 'crosshair' : 'auto'
  container.addEventListener('keydown', event => container.style.cursor = cursor(event))
  container.addEventListener('keyup', event => container.style.cursor = cursor(event))

  // NOTE: 'preclick' and 'click' are not fired when ctrl key is pressed.
  ;['mouseup'].forEach(type => map.on(type, event => {
    if(pickMode(event.originalEvent)) {
      // TODO: give visual feedback that something happend
      const pointXY = L.point(event.layerPoint.x, event.layerPoint.y)
      const latlng = map.layerPointToLatLng(pointXY).wrap()
      // TODO: get coordinate format from user setting (once implemented)
      clipboard.writeText(`${latlng.lat} ${latlng.lng}`)
    }
  }))
})()



// Apply display filter values from user settings.
displayFilter.read({}).then(applyDisplayFilters(map))

container.focus()

ipcRenderer.on('COMMAND_MAP_TILE_PROVIDER', (_, options) => {
  Leaflet.layers(map)
    .filter(layer => layer instanceof L.TileLayer)
    .forEach(layer => map.removeLayer(layer))
    L.tileLayer(options.url, options).addTo(map)
})

module.exports = {
  applyDisplayFilters: applyDisplayFilters(map),
  focus: focus(container)
}
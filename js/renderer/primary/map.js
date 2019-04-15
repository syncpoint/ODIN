const { ipcRenderer, clipboard } = require('electron')
const Leaflet = require('../common/leaflet')
const { displayFilter, mapViewport } = require('./user-settings')
const { K } = require('../../shared/predef')

const applyDisplayFilters = map => values => {
  const styles = Leaflet.panes(layer => layer instanceof L.TileLayer)(map).map(pane => pane.style)
  const filter = Object.entries(values)
    .map(([name, { value, unit }]) => `${name}(${value}${unit})`)
    .join(' ')

  styles.forEach(style => (style.filter = filter))
}

const focus = container => () => container.focus()

const options = {
  zoomControl: false,
  boxZoom: true,
  center: L.latLng(48.65400545105681, 15.319061279296877),
  zoom: 13,
  attributionControl: true
}

const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  id: 'OpenStreetMap.Mapnik',
  detectRetina: false,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

const container = document.getElementsByClassName('odin-map')[0]

const map = K(L.map(container, options))(map => {
  tileLayer.addTo(map)
  map.on('moveend', () => {
    const { lat, lng } = map.getCenter()
    const viewport = { lat, lng, zoom: map.getZoom() }
    mapViewport.write(viewport)
  })

  mapViewport.read().then(viewport => {
    if (!viewport) return
    map.setView(L.latLng(viewport.lat, viewport.lng), viewport.zoom)
  })
})

// Pick/copy coordinate to clipboard
;(() => {
  const pickMode = event => event.ctrlKey && event.shiftKey
  const cursor = event => pickMode(event) ? 'crosshair' : 'auto'
  container.addEventListener('keydown', event => (container.style.cursor = cursor(event)))
  container.addEventListener('keyup', event => (container.style.cursor = cursor(event)))

  // NOTE: 'preclick' and 'click' are not fired when ctrl key is pressed.
  ;['mouseup'].forEach(type => map.on(type, event => {
    if (pickMode(event.originalEvent)) {
      new Audio('assets/double-click.wav').play()
      const pointXY = L.point(event.layerPoint.x, event.layerPoint.y)
      const latlng = map.layerPointToLatLng(pointXY).wrap()
      // TODO: get coordinate format from user setting (once implemented)
      clipboard.writeText(`${latlng.lat} ${latlng.lng}`)

      const originalFilter = container.style.filter
      const reset = () => (container.style.filter = originalFilter)
      container.style.filter = 'invert(100%)'
      setTimeout(reset, 50)

      const label = document.getElementsByClassName('odin-osd-temporary')[0]
      label.innerHTML = 'Copied coordinate to clipboard'
      label.style.display = 'block'
      setTimeout(() => {
        label.style.display = 'none'
        label.innerHTML = ''
      }, 1500)
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

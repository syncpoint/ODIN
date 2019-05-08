const map = L.map('map', {
  center: L.latLng(48.65400545105681, 15.319061279296877),
  zoomControl: false, // default: true
  zoom: 13
})

const url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const tileLayer = L.tileLayer(url, {
  "name": "OpenStreetMap",
  "maxZoom": 19,
  "attribution": "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
})

tileLayer.addTo(map)

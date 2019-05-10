import React from 'react'
import Map from './Map'

const center = L.latLng(48.65400545105681, 15.319061279296877)
const mapOptions = {
  center,
  zoomControl: false, // default: true
  zoom: 13
}

const tileProvider = {
  "id": "OpenStreetMap.Mapnik",
  "name": "OpenStreetMap",
  "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "maxZoom": 19,
  "attribution": "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
}

const App = props =>
  <div>
    <Map
      id='map'
      className='map'
      tileProvider={ tileProvider }
      options={ mapOptions }
    />
  </div>

export default App
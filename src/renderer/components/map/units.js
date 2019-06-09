import L from 'leaflet'
import evented from '../../evented'
import '../../leaflet/L.GeoJSON.Symbols'

evented.on('MAP_CREATED', map => {
  new L.GeoJSON.Symbols({
    id: 'layer-0815',
    size: () => 34,
    trackSelection: false, // default: false
    features: () => [
      {
        type: 'Feature',
        id: 4711,
        geometry: { type: 'Point', coordinates: [ 16.481308, 48.036351 ] },
        properties: { m: '73', t: '1', sidc: 'SFGPUST----C---' }
      },
      {
        type: 'Feature',
        id: 92734,
        geometry: { type: 'Point', coordinates: [ 16.548137, 48.030269 ] },
        properties: { m: '2/73', t: '1', sidc: 'SFGPUCR----B---' }
      }
    ]
  }).addTo(map)
})

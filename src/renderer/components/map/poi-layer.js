import L from 'leaflet'
import ms from 'milsymbol'
import { K } from '../../../shared/combinators'
import poiStore from '../../stores/poi-store'

const sizes = {
  '7': 20,
  '8': 25,
  '9': 30
  // '10': 35,
  // '11': 40,
  // '12': 45
}

const poiLayer = map => {
  const zoom = map.getZoom()
  const featureLayers = {}

  const onEachFeature = (feature, layer) => {
    featureLayers[feature.properties.id] = layer
  }

  const filter = (feature, layer) => {
    return true
  }

  const pointToLayer = (feature, latlng) => {
    const options = {}
    if (zoom > 12) options.uniqueDesignation = feature.properties.id
    const size = sizes[zoom] || 32
    const symbol = K(new ms.Symbol(feature.properties.sidc, options))(symbol => symbol.setOptions({ size }))

    const icon = L.divIcon({
      className: '',
      html: symbol.asSVG(),
      iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y)
    })

    const marker = L.marker(latlng, { icon, draggable: false })
    return marker
  }

  let layer = null

  const feature = poi => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [poi.lng, poi.lat] },
    properties: { id: poi.id, sidc: 'GFGPGPRI----' }
  })

  poiStore.evented.on('ready', model => {
    const features = Object.entries(model)
      .map(([id, poi]) => ({ id, ...poi }))
      .map(feature)

    const geojson = { type: 'FeatureCollection', features }
    layer = L.geoJSON(geojson, {
      onEachFeature,
      filter,
      pointToLayer
    })

    layer.id = 'POI_LAYER'
    layer.addTo(map)
  })

  poiStore.evented.on('added', poi => layer.addData(feature(poi)))
  poiStore.evented.on('removed', id => {
    featureLayers[id] && layer.removeLayer(featureLayers[id])
    delete featureLayers[id]
  })
}

export default poiLayer

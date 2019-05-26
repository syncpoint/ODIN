import L from 'leaflet'
import ms from 'milsymbol'
import poiStore from '../../stores/poi-store'
import selection from '../App.selection'

const sizes = {
  '7': 20,
  '8': 25,
  '9': 30
}

const poiLayer = map => {
  let layer = null
  let selectedId
  const zoom = map.getZoom()

  // POI/id -> marker (layer)
  const featureLayers = {}

  const deselect = () => {
    if (!selectedId) return
    const layer = featureLayers[selectedId]
    layer.setIcon(layer.options.icons.standard)
    selectedId = undefined
  }

  const select = id => {
    deselect()
    selectedId = id
    const layer = featureLayers[selectedId]
    layer.setIcon(layer.options.icons.highlighted)
    selection.select(layer.feature)
  }

  selection.evented.on('deselected', deselect)

  map.on('click', selection.deselect)
  map.on('keydown', event => {
    if (!selectedId) return
    const { originalEvent } = event
    if (originalEvent.key === 'Backspace' && originalEvent.metaKey) poiStore.remove(selectedId)
    else if (originalEvent.key === 'Delete') poiStore.remove(selectedId)
    else if (originalEvent.key === 'Escape') selection.deselect()
  })

  const pointToLayer = (feature, latlng) => {
    const { id, sidc } = feature.properties
    const size = sizes[zoom] || 40
    const options = { size }
    if (zoom > 12) options.uniqueDesignation = id
    const symbol = options => new ms.Symbol(sidc, options)

    const divIcon = symbol => L.divIcon({
      className: '',
      html: symbol.asSVG(),
      iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y)
    })

    // Create marker layer:
    const marker = L.marker(latlng, {
      id,
      icons: {
        standard: divIcon(symbol(options)),
        highlighted: divIcon(symbol({
          ...options,
          monoColor: 'white',
          outlineColor: 'grey',
          outlineWidth: 4
        }))
      },
      keyboard: false, // default: true
      draggable: true, // default: false
      autoPan: true,
      autoPanSpeed: 10 // default: 10
    })

    marker.on('moveend', event => {
      const { target } = event
      const id = target.options.id
      const { lat, lng } = target.getLatLng()
      poiStore.move(id, { lat, lng })
      select(id)
    })

    marker.on('click', event => {
      const id = event.target.options.id
      if (selectedId === id) return selection.deselect()
      else select(id)
    })

    marker.id = id

    marker.setIcon(marker.options.icons.standard)
    featureLayers[feature.properties.id] = marker
    return featureLayers[feature.properties.id]
  }

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
    layer = L.geoJSON(geojson, { pointToLayer })

    layer.id = 'POI_LAYER'
    layer.addTo(map)
  })

  poiStore.evented.on('added', poi => {
    layer.addData(feature(poi))
    select(poi.id)
  })

  poiStore.evented.on('removed', id => {
    if (featureLayers[id]) {
      selection.deselect()
      layer.removeLayer(featureLayers[id])
      delete featureLayers[id]
      if (selectedId === id) selectedId = undefined
    }
  })
}

export default poiLayer

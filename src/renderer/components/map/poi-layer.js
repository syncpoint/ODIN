import L from 'leaflet'
import ms from 'milsymbol'
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
  let layer = null
  let selection
  const zoom = map.getZoom()
  const featureLayers = {}

  const deselect = () => {
    if (!selection) return
    layer.removeLayer(featureLayers[selection].highlight)
    layer.addLayer(featureLayers[selection].standard)
    selection = undefined
  }

  const select = id => {
    deselect()
    layer.removeLayer(featureLayers[id].standard)
    layer.addLayer(featureLayers[id].highlight)
    selection = id
  }

  map.on('click', deselect)

  map.on('keydown', event => {
    if (!selection) return

    const { originalEvent } = event
    if (originalEvent.key === 'Backspace' && originalEvent.metaKey) poiStore.remove(selection)
    else if (originalEvent.key === 'Delete') poiStore.remove(selection)
  })

  const pointToLayer = (feature, latlng) => {
    const { id, sidc } = feature.properties
    const size = sizes[zoom] || 40
    const options = {
      size
    }

    if (zoom > 12) options.uniqueDesignation = id

    const symbol = options => new ms.Symbol(sidc, options)

    const icon = symbol => L.divIcon({
      className: '',
      html: symbol.asSVG(),
      iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y)
    })

    // Create marker layer:
    const marker = icon => {
      const marker = L.marker(latlng, {
        icon,
        keyboard: false, // default: true
        draggable: true, // default: false
        autoPan: true,
        autoPanSpeed: 10 // default 10
      })

      marker.on('moveend', event => {
        const { target } = event
        const { lat, lng } = target.getLatLng()
        poiStore.move(id, { lat, lng })

        // synchronize positions for standard and highlighted markers:
        if (featureLayers[id].standard === target) {
          featureLayers[id].highlight.setLatLng(featureLayers[id].standard.getLatLng())
        } else {
          featureLayers[id].standard.setLatLng(featureLayers[id].highlight.getLatLng())
        }

        select(id)
      })

      marker.on('click', event => {
        const { target } = event
        if (!featureLayers[id]) return
        if (featureLayers[id].standard === target) select(id)
        else deselect()
      })

      marker.id = id
      return marker
    }

    featureLayers[feature.properties.id] = {
      standard: marker(icon(symbol(options))),
      highlight: marker(icon(symbol({
        ...options,
        monoColor: 'white',
        outlineColor: 'grey',
        outlineWidth: 4
      })))
    }

    return featureLayers[feature.properties.id].standard
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
      layer.removeLayer(featureLayers[id].standard)
      layer.removeLayer(featureLayers[id].highlight)
      delete featureLayers[id]
      if (selection === id) selection = undefined
    }
  })
}

export default poiLayer

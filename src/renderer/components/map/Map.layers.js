import { ipcRenderer } from 'electron'
import L from 'leaflet'
import evented from '../../evented'
import store from '../../stores/layer-store'
import undoBuffer from '../App.undo-buffer'
import { ResourceNames } from '../../model/resource-names'
import { K } from '../../../shared/combinators'
import settings from '../../model/settings'

const layerUrn = layerId => ResourceNames.layerId(layerId)
const featureUrn = (layerId, featureId) => ResourceNames.featureId(layerId, featureId)

const genericShape = (feature, options) => {
  if (!feature.geometry) return null
  switch (feature.geometry.type) {
    case 'Point': return new L.Feature.Symbol(feature, options)
    case 'Polygon': return new L.Feature.Polygon(feature, options)
    case 'LineString': return new L.Feature.Polyline(feature, options)
    default: return null
  }
}

const adaptFeature = (layerId, featureId, feature, lineSmoothing) => {
  const update = feature => {
    const command = store.commands.update(layerId, featureId)(feature)
    undoBuffer.push(command)
    command.run()
  }

  const options = {
    interactive: true,
    bubblingMouseEvents: false,
    lineSmoothing,
    update: update
  }

  const sidc = feature.properties.sidc
  const key = `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  const layer = L.Feature[key] ? new L.Feature[key](feature, options) : genericShape(feature, options)
  return layer
}

const bounds = bbox => {
  if (!bbox) return
  if (typeof bbox !== 'string') return

  const bounds = (lat1, lng1, lat2, lng2) => L.latLngBounds(L.latLng(lat1, lng1), L.latLng(lat2, lng2))

  // Format: PostGIS (ST_Extent())
  const regex = /BOX\((.*)[ ]+(.*)[, ]+(.*)[ ]+(.*)\)/
  const match = bbox.match(regex)
  if (match) {
    /* eslint-disable no-unused-vars */
    const [_, lng1, lat1, lng2, lat2] = match
    return bounds(lat1, lng1, lat2, lng2)
    /* eslint-enable no-unused-vars */
  }

  // Format: GeoJSON (simple array)
  const [lng1, lat1, lng2, lat2] = JSON.parse(bbox)
  return bounds(lat1, lng1, lat2, lng2)
}

evented.on('MAP_CREATED', map => {
  let lineSmoothing = settings.map.getLineSmoothing()
  let replaying = true
  let state = {}

  // layers :: urn -> (layer group | feature layer)
  const layers = {}

  const deleteLayer = urn => { layers[urn].remove(); delete layers[urn] }

  const refreshView = () => Object.entries(state).reduce((acc, [layerId, layer]) => {
    const featureLayers = Object.entries(layer.features)
      .filter(([_, feature]) => feature.properties.sidc)
      .map(([featureId, feature]) => {
        const layer = adaptFeature(layerId, featureId, feature, lineSmoothing)
        if (!layer) return null
        const urn = featureUrn(layerId, featureId)
        acc[urn] = layer
        acc[urn].urn = urn
        return layers[urn]
      })
      .filter(layer => layer)

    const urn = layerUrn(layerId)
    acc[urn] = new L.LayerGroup(featureLayers)
    if (layer.show) acc[urn].addTo(map)

    return acc
  }, layers)

  const render = {
    'replay-ready': () => {
      refreshView()
      const filter = Object.entries(settings.map.getDisplayFilters())
        .map(([name, { value, unit }]) => `${name}(${value}${unit})`)
        .join(' ')

      const include = name => ['tilePane', 'markerPane', 'overlayPane'].includes(name)
      Object.entries(map.getPanes())
        .filter(([name, _]) => include(name))
        .forEach(([_, pane]) => (pane.style.filter = filter))
    },
    'layer-added': ({ layerId, show }) => {
      const urn = layerUrn(layerId)
      layers[urn] = new L.LayerGroup([])
      if (show) layers[urn].addTo(map)
    },

    'bounds-updated': ({ layerId, bbox }) => {
      K(bounds(bbox))(bounds => {
        if (bounds) map.fitBounds(bounds)
      })
    },

    'layer-deleted': ({ layerId }) => deleteLayer(layerUrn(layerId)),
    'layer-hidden': ({ layerId }) => layers[layerUrn(layerId)].remove(),
    'layer-shown': ({ layerId }) => layers[layerUrn(layerId)].addTo(map),

    'feature-added': ({ layerId, featureId, feature }) => {
      if (!feature.properties.sidc) return console.log('missing SIDC', feature)
      const layer = adaptFeature(layerId, featureId, feature, lineSmoothing)
      if (!layer) return console.log('feature unsupported', feature)
      const urn = featureUrn(layerId, featureId)
      layers[urn] = layer
      layers[urn].urn = urn
      layers[urn].addTo(layers[layerUrn(layerId)])
    },

    'feature-updated': ({ layerId, featureId, feature }) => layers[featureUrn(layerId, featureId)].updateData(feature),
    'feature-deleted': ({ layerId, featureId }) => deleteLayer(featureUrn(layerId, featureId)),
    'options-updated': () => {
      // Tear down every visible layer and build from scratch.
      Object.values(layers).forEach(layer => layer.remove())
      refreshView()
    }
  }

  const handlers = {
    'snapshot': ({ snapshot }) => (state = snapshot),
    'replay-ready': () => (replaying = false),
    'layer-added': ({ layerId, show }) => (state[layerId] = { show, features: {} }),
    'layer-deleted': ({ layerId }) => delete state[layerId],
    'layer-hidden': ({ layerId }) => (state[layerId].show = false),
    'layer-shown': ({ layerId }) => (state[layerId].show = true),
    'feature-added': ({ layerId, featureId, feature }) => (state[layerId].features[featureId] = feature),
    'feature-updated': ({ layerId, featureId, feature }) => (state[layerId].features[featureId] = feature),
    'feature-deleted': ({ layerId, featureId }) => delete state[layerId].features[featureId]
  }

  store.register(event => {
    handlers[event.type] && handlers[event.type](event)
    if (replaying || !render[event.type]) return
    render[event.type](event)
  })

  ipcRenderer.on('COMMAND_TOGGLE_LINE_SMOOTHING', (_, args) => {
    lineSmoothing = args
    settings.map.setLineSmoothing(args)
    render['options-updated']()
  })
})

import L from 'leaflet'
import evented from '../../evented'
import store from '../../stores/layer-store'
import undoBuffer from '../App.undo-buffer'
import { ResourceNames } from '../../model/resource-names'

const layerUrn = layerId => ResourceNames.layerId(layerId)
const featureUrn = (layerId, featureId) => ResourceNames.featureId(layerId, featureId)

const genericShape = (feature, options) => {
  switch (feature.geometry.type) {
    case 'Point': return new L.Feature.Symbol(feature, options)
    case 'Polygon': return new L.Feature.Polygon(feature, options)
    case 'LineString': return new L.Feature.Polyline(feature, options)
    default: return null
  }
}

const adaptFeature = (layerId, featureId, feature) => {
  const updateGeometry = geometry => {
    const command = store.commands.updateGeometry(layerId, featureId)(geometry)
    undoBuffer.push(command)
    command.run()
  }

  const options = {
    interactive: true,
    bubblingMouseEvents: false,
    updateGeometry
  }

  const sidc = feature.properties.sidc
  const key = `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  const layer = L.Feature[key] ? new L.Feature[key](feature, options) : genericShape(feature, options)
  return layer
}

evented.on('MAP_CREATED', map => {
  let replaying = true
  let state = {}

  // layers :: urn -> (layer group | feature layer)
  const layers = {}

  const deleteLayer = urn => { layers[urn].remove(); delete layers[urn] }

  const render = {
    'replay-ready': () => Object.entries(state).reduce((acc, [layerId, layer]) => {
      const featureLayers = Object.entries(layer.features).map(([featureId, feature]) => {
        const urn = featureUrn(layerId, featureId)
        acc[urn] = adaptFeature(layerId, featureId, feature)
        acc[urn].urn = urn
        return layers[urn]
      })

      const urn = layerUrn(layerId)
      acc[urn] = new L.LayerGroup(featureLayers)
      if (layer.show) acc[urn].addTo(map)
      return acc
    }, layers),

    'layer-added': ({ layerId, show }) => {
      const urn = layerUrn(layerId)
      layers[urn] = new L.LayerGroup([])
      if (show) layers[urn].addTo(map)
    },

    'layer-deleted': ({ layerId }) => deleteLayer(layerUrn(layerId)),
    'layer-hidden': ({ layerId }) => layers[layerUrn(layerId)].remove(),
    'layer-shown': ({ layerId }) => layers[layerUrn(layerId)].addTo(map),

    'feature-added': ({ layerId, featureId, feature }) => {
      const urn = featureUrn(layerId, featureId)
      layers[urn] = adaptFeature(layerId, featureId, feature)
      layers[urn].urn = urn
      layers[urn].addTo(layers[layerUrn(layerId)])
    },

    'feature-updated': ({ layerId, featureId, feature }) => layers[featureUrn(layerId, featureId)].updateData(feature),
    'feature-deleted': ({ layerId, featureId }) => deleteLayer(featureUrn(layerId, featureId))
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
    if (!handlers[event.type]) return
    handlers[event.type](event)
    if (replaying || !render[event.type]) return
    render[event.type](event)
  })
})

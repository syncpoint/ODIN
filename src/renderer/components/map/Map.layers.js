import L from 'leaflet'
import evented from '../../evented'
import { K } from '../../../shared/combinators'
import store from '../../stores/layer-store'
import undoBuffer from '../App.undo-buffer'
import { ResourceNames } from '../../model/resource-names'

const layers = container => K([])(layers => container.eachLayer(layer => layers.push(layer)))
const filterLayers = (container, urn) => layers(container).filter(layer => layer.urn === urn)

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

const featureLayer = (layerId, featureId, feature) => {

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
  layer.urn = featureUrn(layerId, featureId)
  return layer
}

const featureLayers = (layerId, features) =>
  Object.entries(features)
    .map(([featureId, feature]) => featureLayer(layerId, featureId, feature))

const groupLayer = (layerId, featureLayers) =>
  K(new L.LayerGroup(featureLayers))(layer => (layer.urn = layerUrn(layerId)))

const groupLayers = layers =>
  Object.entries(layers)
    .filter(([_, layer]) => layer.show)
    .map(([layerId, layer]) => [layerId, featureLayers(layerId, layer.features)])
    .map(([layerId, featureLayers]) => groupLayer(layerId, featureLayers))

const removeLayer = container => urn =>
  layers(container)
    .filter(layer => layer.urn === urn)
    .forEach(layer => container.removeLayer(layer))


evented.on('MAP_CREATED', map => {

  const handlers = {
    'layer-added': ({ layerId }) => groupLayer(layerId, []).addTo(map),
    'layer-deleted': ({ layerId }) => removeLayer(map)(layerUrn(layerId)),
    'layer-hidden': ({ layerId }) => removeLayer(map)(layerUrn(layerId)),
    'layer-shown': ({ layerId }) => groupLayers([store.layer(layerId)]).forEach(layer => layer.addTo(map)),

    'feature-added': ({ layerId, featureId, feature }) => filterLayers(map, layerUrn(layerId))
      .forEach(layer => featureLayer(layerId, featureId, feature).addTo(layer)),

    'feature-updated': ({ layerId, featureId, feature }) => filterLayers(map, layerUrn(layerId))
      .forEach(group => filterLayers(group, featureUrn(layerId, featureId))
        .forEach(layer => layer.updateData(feature))),

    'feature-deleted': ({ layerId, featureId }) => filterLayers(map, layerUrn(layerId))
      .forEach(group => filterLayers(group, featureUrn(layerId, featureId))
        .forEach(feature => feature.remove()))
  }

  const onReady = state => groupLayers(state).forEach(layer => layer.addTo(map))
  store.on('event', event => (handlers[event.type] || (() => {}))(event))
  if (store.ready()) onReady(store.state())
  else store.on('ready', onReady)
})

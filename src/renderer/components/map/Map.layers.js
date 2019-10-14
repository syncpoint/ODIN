import { ipcRenderer } from 'electron'
import L from 'leaflet'
import ms from 'milsymbol'
import evented from '../../evented'
import store from '../../stores/layer-store'
import undoBuffer from '../App.undo-buffer'
import { ResourceNames } from '../../model/resource-names'
import { K } from '../../../shared/combinators'
import settings from '../../model/settings'

const layerUrn = layerId => ResourceNames.layerId(layerId)
const featureUrn = (layerId, featureId) => ResourceNames.featureId(layerId, featureId)
const validSymbol = sidc => new ms.Symbol(sidc, {}).isValid()

const genericShape = (feature, options) => {
  if (!feature.geometry) return null
  const { sidc } = feature.properties

  switch (feature.geometry.type) {
    case 'Point': {
      if (!sidc) return null // no generic point feature without SIDC
      if (!validSymbol(sidc)) return null // no point features other than symbols
      return new L.Feature.Symbol(feature, options)
    }
    case 'Polygon': return new L.TACGRP.PolygonAreaTitled(feature, options)
    case 'LineString': return new L.TACGRP.Polyline(feature, options)
    default: return null
  }
}

const adaptFeature = (layerId, featureId, feature, featureOptions) => {
  const update = feature => {
    const command = store.commands.update(layerId, featureId)(feature)
    undoBuffer.push(command)
    command.run()
  }

  const options = {
    interactive: true,
    bubblingMouseEvents: false,
    update: update,
    ...featureOptions
  }

  const sidc = feature.properties.sidc
  if (!sidc) return genericShape(feature, options)

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
  let replaying = true
  let state = {}

  const featureOptions = {
    lineSmoothing: settings.map.getLineSmoothing(),
    hideLabels: map.getZoom() < 12
      ? true
      : settings.map.getHideLabels()
  }

  // layers :: urn -> (layer group | feature layer)
  const layers = {}

  const deleteLayer = urn => { layers[urn].remove(); delete layers[urn] }

  const refreshView = () => Object.entries(state).reduce((acc, [layerId, layer]) => {

    const featureLayers = Object.entries(layer.features)
      .map(([featureId, feature]) => {
        const urn = featureUrn(layerId, featureId)
        const layer = adaptFeature(layerId, featureId, feature, featureOptions)
        return [urn, layer]
      })
      .filter(([_, layer]) => layer)
      .map(([urn, layer]) => {
        acc[urn] = layer
        acc[urn].urn = urn
        return layers[urn]
      })

    const urn = layerUrn(layerId)
    acc[urn] = new L.LayerGroup(featureLayers)
    if (layer.show) acc[urn].addTo(map)

    return acc
  }, layers)

  const render = {
    'replay-ready': () => refreshView(),
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
      if (!feature.geometry) return console.log('missing geometry', feature)

      const layer = adaptFeature(layerId, featureId, feature, featureOptions)
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
      // FIXME: This is a pretty stupid idea!
      // TODO: Pass new options downstream instead of refreshing everything
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

  ipcRenderer.on('COMMAND_LINE_SMOOTHING', (_, args) => {
    featureOptions.lineSmoothing = args
    settings.map.setLineSmoothing(args)
    render['options-updated']()
  })

  ipcRenderer.on('COMMAND_LABELS', (_, args) => {
    featureOptions.hideLabels = !args
    settings.map.setHideLabels(!args)
    render['options-updated']()
  })

  map.on('zoomend', event => {
    const hideLabels = featureOptions.hideLabels
    featureOptions.hideLabels = event.target.getZoom() < 12
      ? true
      : settings.map.getHideLabels()

    if (hideLabels !== featureOptions.hideLabels) render['options-updated']()
  })
})

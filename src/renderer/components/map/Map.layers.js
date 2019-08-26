import React from 'react'
import L from 'leaflet'
import uuid from 'uuid-random'
import evented from '../../evented'
import store from '../../stores/layer-store'
import undoBuffer from '../App.undo-buffer'
import FeatureProperties from '../properties/FeatureProperties'
import { featureClasses } from '../properties/feature-classes'
import { featureFields } from '../properties/feature-fields'

const featureAdaptor = (layerId, featureId, feature) => {

  const updateGeometryCommand = (currentGeometry, newGeometry) => ({
    run: () => {
      feature.geometry = newGeometry
      store.updateFeature(layerId)(featureId, { ...feature })
    },
    inverse: () => updateGeometryCommand(newGeometry, currentGeometry)
  })

  return {
    featureId,
    ...feature,

    // FIXME: actions are too tightly coupled

    'delete': () => store.deleteFeature(layerId)(featureId),
    copy: () => ({ type: feature.type, title: feature.title, geometry: feature.geometry, properties: feature.properties }),
    paste: object => {
      // Only default layer (layerId: 0) can receive new features.
      store.addFeature(0)(uuid(), ({
        type: object.type,
        title: object.title,
        geometry: object.geometry,
        properties: object.properties
      }))
    },
    updateGeometry: geometry => {
      const command = updateGeometryCommand(feature.geometry, geometry)
      undoBuffer.push(command)
      command.run()
    },
    edit: object => () => {
      const sidc = object.properties.sidc
      const classes = Object.entries(featureClasses)
        .filter(([_, descriptor]) => descriptor.patterns)
        .filter(([_, descriptor]) => descriptor.patterns.some(pattern => sidc.match(pattern)))
        .map(([name]) => name)

      if (classes.length !== 1) return

      const fields = Object.entries(featureFields)
        .filter(([_, descriptor]) => !descriptor.classes || descriptor.classes[classes[0]])
        .map(([key, descriptor]) => ({ key: key.toLowerCase(), ...descriptor }))

      return <FeatureProperties layerId={ layerId } featureId={ featureId } fields={ fields }/>
    }
  }
}

evented.on('MAP_CREATED', map => {
  const layers = {}

  const handlers = {
    'layer-added': ({ layerId }) => {
      layers[layerId] = new L.Feature.Layer([]).addTo(map)
    },

    'layer-deleted': ({ layerId }) => {
      map.removeLayer(layers[layerId])
      delete layers[layerId]
    },

    'layer-shown': ({ layerId }) => layers[layerId].addTo(map),
    'layer-hidden': ({ layerId }) => map.removeLayer(layers[layerId]),

    'feature-added': ({ layerId, featureId, feature }) => {
      if (!layers[layerId]) return
      layers[layerId].addData(featureAdaptor(layerId, featureId, feature))
    },

    'feature-updated': ({ layerId, featureId, feature }) => {
      if (!layers[layerId]) return
      layers[layerId].eachLayer(featureLayer => {
        if (featureLayer.feature.featureId === featureId) {
          featureLayer.updateData(feature)
        }
      })
    },

    'feature-deleted': ({ layerId, featureId }) => {
      if (!layers[layerId]) return
      layers[layerId].eachLayer(featureLayer => {
        if (featureLayer.feature.featureId !== featureId) return
        layers[layerId].removeLayer(featureLayer)
      })
    }
  }

  const createLayers = state => {
    Object.entries(state).forEach(([layerId, layer]) => {
      const features = Object.entries(layer.features).map(([featureId, feature]) => {
        return featureAdaptor(layerId, featureId, feature)
      })

      layers[layerId] = new L.Feature.Layer(features)
      if (layer.show) layers[layerId].addTo(map)
    })
  }

  store.on('event', event => (handlers[event.type] || (() => {}))(event))

  if (store.ready()) createLayers(store.state())
  else store.on('ready', createLayers)
})

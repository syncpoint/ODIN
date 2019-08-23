import L from 'leaflet'
import uuid from 'uuid-random'
import evented from '../../evented'
import store from '../../stores/layer-store'
import undoBuffer from '../App.undo-buffer'

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

import { K, I, uniq } from '../../../shared/combinators'
import Feature from '../../project/Feature'
import URI from '../../project/URI'

const addFeatures = (next, features) =>
  features.forEach(feature => {
    const layerId = Feature.layerId(feature)
    const featureId = Feature.id(feature)
    next[layerId].features[featureId] = {
      id: featureId,
      name: feature.getProperties().t
    }
  })

const addLayer = (next, layer, features) => {
  next[layer.id] = { ...layer, features: {} }
  addFeatures(next, features)
}

const elementById = next => id =>
  URI.isLayerId(id)
    ? next[id]
    : next[URI.layerId(id)].features[id]


/**
 * Handle input layer events.
 * NOTE: Functions must be pure and must allow to be called twice for same event.
 */
export default {
  snapshot: (prev, { layers, features }) => K({ ...prev })(next => {
    layers.forEach(layer => (next[layer.id] = { ...layer, features: {} }))
    addFeatures(next, features)
  }),

  featuresadded: (prev, { features }) => K({ ...prev })(next => {
    addFeatures(next, features)

    // Update lock/hidden layer states.
    features
      .map(Feature.layerId)
      .filter(uniq)
      .forEach(layerId => {
        next[layerId].locked = features.some(Feature.locked)
        next[layerId].hidden = features.some(Feature.hidden)
      })
  }),

  featuresremoved: (prev, { ids }) => K({ ...prev })(next => {
    ids.forEach(id => delete next[URI.layerId(id)].features[id])
  }),

  layerlocked: (prev, { layerId, locked }) => K({ ...prev })(next => {
    next[layerId].locked = locked
  }),

  layerhidden: (prev, { layerId, hidden }) => K({ ...prev })(next => {
    next[layerId].hidden = hidden
  }),

  layeractivated: (prev, { layerId }) => K({ ...prev })(next => {
    Object.values(next).forEach(layer => (layer.active = false))
    next[layerId].active = true
  }),

  layerdeactivated: (prev, { layerId }) => K({ ...prev })(next => {
    delete next[layerId].active
  }),

  layerrenamed: (prev, { layerId, name }) => K({ ...prev })(next => {
    next[layerId].name = name
    delete next[layerId].editor
  }),

  layerremoved: (prev, { layerId }) => K({ ...prev })(next => {
    delete next[layerId]
  }),

  layercreated: (prev, { layer, features, selected }) => K({ ...prev })(next => {
    addLayer(next, layer, features)
    next[layer.id].selected = selected
  }),

  layeradded: (prev, { layer, features }) => K({ ...prev })(next => {
    addLayer(next, layer, features)
  }),

  // internal events =>

  deselected: (prev, { ids }) => K({ ...prev })(next =>
    ids
      .map(elementById(next))
      .filter(I)
      .forEach(element => delete element.selected)
  ),

  selected: (prev, { ids }) => K({ ...prev })(next =>
    ids
      .map(elementById(next))
      .filter(I)
      .forEach(element => (element.selected = true))
  ),

  layerexpanded: (prev, { layerId }) => K({ ...prev })(next => {
    Object.keys(next).forEach(id => (next[id].expanded = id === layerId))
  }),

  editoractivated: (prev, { layerId }) => K({ ...prev })(next => {
    next[layerId].editor = next[layerId].name
  }),

  editorupdated: (prev, { layerId, value }) => K({ ...prev })(next => {
    next[layerId].editor = value
  }),

  editordeactivated: (prev, { layerId }) => K({ ...prev })(next => {
    delete next[layerId].editor
  })
}

import { K, I, uniq } from '../../../shared/combinators'
import Feature from '../../project/Feature'
import URI from '../../project/URI'

const addFeatures = (next, features) =>
  features.forEach(feature => {
    const layerId = Feature.layerId(feature)
    const featureId = Feature.id(feature)
    next[layerId].features[featureId] = {
      id: featureId,
      name: feature.get('name') || feature.get('t') || 'N/A'
    }
  })

const addLayer = (next, layer, features) => {
  next[layer.id] = { id: layer.id, name: layer.name, features: {} }
  addFeatures(next, features)
}

const elementById = next => id =>
  URI.isLayerId(id)
    ? next[id]
    : next[URI.layerId(id)].features[id]


/**
 * Handle input layer events.
 * NOTE: Functions must be pure and must allow to be called twice for same event.
 * State has the following structure:
 *
 *  {
 *    layerId: {
 *      id: string (layerId)
 *      name: string
 *      active: boolean
 *      locked: boolean
 *      hidden: boolean
 *      expanded: boolean
 *      selected: boolean
 *      features: {
 *        featureId: {
 *          id: string (featureId)
 *          name: string
 *          selected: boolean
 *        }
 *      },
 *      ...
 *    },
 *    ...
 *  }
 */
export default {
  snapshot: (prev, { layers, features }) => K({ ...prev })(next => {
    layers.forEach(layer => (next[layer.id] = { ...layer, features: {} }))
    addFeatures(next, features)
  }),

  featuresadded: (prev, { features }) => K({ ...prev })(next => {
    addFeatures(next, features)

    // Update locked/hidden layer states.
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

  featurepropertiesupdated: (prev, { featureId, properties }) => K({ ...prev })(next => {
    const layer = next[URI.layerId(featureId)]
    layer.features[featureId] = {
      ...layer.features[featureId],
      name: properties.name || properties.t || 'N/A'
    }
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
    // Ignore if editor is already active:
    if (typeof next[layerId].editor === 'string') return
    next[layerId].editor = next[layerId].name
  }),

  editorupdated: (prev, { layerId, value }) => K({ ...prev })(next => {
    next[layerId].editor = value

    const duplicate = Object.entries(next)
      .find(([id, layer]) => id !== layerId && value.toUpperCase() === layer.name.toUpperCase())

    // TODO: i18n
    if (duplicate) return (next[layerId].error = 'Name is already used.')
    if (value === '') return (next[layerId].error = 'Name must not be empty.')
    if (value.length > 64) return (next[layerId].error = 'Name is too long.')
    if (!/^[\w\-_.()# ]+$/i.test(value)) return (next[layerId].error = 'Name contains invalid characters.')

    delete next[layerId].error
  }),

  editordeactivated: (prev, { layerId }) => K({ ...prev })(next => {
    delete next[layerId].editor
  })
}

import { Writable } from 'stream'
import EventEmitter from 'events'
import { ipcRenderer } from 'electron'
import now from 'nano-time'
import { db } from './db'

// TODO: needs snapshotting capability

const evented = new EventEmitter()
const state = {}
let ready = false

const handlers = {
  'layer-added': ({ layerId, name, show }) => (state[layerId] = { name, show, features: [] }),
  'layer-deleted': ({ layerId }) => delete state[layerId],
  'layer-hidden': ({ layerId }) => (state[layerId].show = false),
  'layer-shown': ({ layerId }) => (state[layerId].show = true),
  'feature-added': ({ layerId, featureId, feature }) => (state[layerId].features[featureId] = feature),
  'feature-updated': ({ layerId, featureId, feature }) => (state[layerId].features[featureId] = feature),
  'feature-deleted': ({ layerId, featureId }) => delete state[layerId].features[featureId]
}

const reduce = event => {
  const handler = handlers[event.type]
  if (handler) return handler(event)
  else console.log('[layer-store] unhandled', event)
}

const persist = event => {
  db.put(`layer:${event.layerId}:${now()}`, event)
  reduce(event)
  evented.emit('event', event)
}

const recoverStream = reduce => new Writable({
  objectMode: true,
  write (chunk, _, callback) {
    reduce(chunk)
    callback()
  },
  final (callback) {
    evented.emit('ready', { ...state })
    ready = true
    callback()
  }
})

db.createReadStream({
  gte: 'layer',
  lte: 'layer\xff',
  keys: false
}).pipe(recoverStream(reduce))

evented.ready = () => ready
evented.state = () => state

// Add new or replace existing layer.
evented.addLayer = (layerId, name) => {
  persist({ type: 'layer-added', layerId, name, show: true })
}

// Delete zero, one or more layers.
evented.deleteLayer = layerIds => (layerIds || Object.keys(state))
  .filter(layerId => state[layerId])
  .map(layerId => ({ type: 'layer-deleted', layerId }))
  .forEach(persist)

evented.hideLayer = layerIds => (layerIds || Object.keys(state))
  .filter(layerId => state[layerId])
  .map(layerId => ({ type: 'layer-hidden', layerId }))
  .forEach(persist)

evented.showLayer = layerIds => (layerIds || Object.keys(state))
  .filter(layerId => state[layerId])
  .map(layerId => ({ type: 'layer-shown', layerId }))
  .forEach(persist)

evented.addFeature = layerId => (featureId, feature) => {
  layerId = Number.isInteger(layerId) ? layerId.toString() : layerId
  if (layerId === '0' && !state[layerId]) {
    persist({ type: 'layer-added', layerId: 0, name: 'Default Layer', show: true })
  }

  // Feature already exists -> bail out.
  if (state[layerId].features[featureId]) return
  persist({ type: 'feature-added', layerId, featureId, feature })
}

evented.updateFeature = layerId => (featureId, feature) => {
  persist({ type: 'feature-updated', layerId, featureId, feature })
}

evented.deleteFeature = layerId => featureId => {
  if (!state[layerId]) return
  if (!state[layerId].features[featureId]) return
  persist({ type: 'feature-deleted', layerId, featureId })
}

evented.feature = (layerId, featureId) => {
  if (!state[layerId]) return
  return state[layerId].features[featureId]
}

ipcRenderer.on('COMMAND_LOAD_LAYER', (_, name, content) => {
  evented.add(name, content)
})

export default evented

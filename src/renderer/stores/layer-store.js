import { Writable } from 'stream'
import EventEmitter from 'events'
import { ipcRenderer } from 'electron'
import now from 'nano-time'
import { db } from './db'

// TODO: needs snapshotting capability

const evented = new EventEmitter()
const state = {}
let ready = false

const reduce = event => {
  switch (event.type) {
    case 'layer-added': state[event.layerId] = { name: event.name, show: event.show, features: [] }; break
    case 'layer-deleted': delete state[event.layerId]; break
    case 'layer-hidden': state[event.layerId].show = false; break
    case 'layer-shown': state[event.layerId].show = true; break
    case 'feature-added':
    case 'feature-updated': state[event.layerId].features[event.featureId] = event.feature; break
    case 'feature-deleted': delete state[event.layerId].features[event.featureId]; break
    default: console.log('[layer-store] unhandled', event)
  }
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

const persist = event => {
  db.put(`layer:${event.layerId}:${now()}`, event)
  reduce(event)
  evented.emit('event', event)
}

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
  const type = state[layerId].features[featureId] ? 'feature-updated' : 'feature-added'
  persist({ type, layerId, featureId, feature })
}

evented.updateFeature = layerId => (featureId, feature) => {
  persist({ type: 'feature-updated', layerId, featureId, feature })
}

evented.deleteFeature = layerId => featureId => {
  if (!state[layerId]) return
  if (!state[layerId].features[featureId]) return
  persist({ type: 'feature-deleted', layerId, featureId })
}

ipcRenderer.on('COMMAND_LOAD_LAYER', (_, name, content) => {
  evented.add(name, content)
})

export default evented

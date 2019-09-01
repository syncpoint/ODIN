import { Writable } from 'stream'
import EventEmitter from 'events'
import { ipcRenderer } from 'electron'
import now from 'nano-time'
import uuid from 'uuid-random'
import * as R from 'ramda'
import { db } from './db'
import { clipboard } from '../components/App.clipboard'

// TODO: purge snapshots

const evented = new EventEmitter()
let state = {
  '0': { name: 'Default Layer', show: true, features: {} }
}

let eventCount = 0
let ready = false

const handlers = {
  'layer-added': ({ layerId, name, show }) => (state[layerId] = { name, show, features: {} }),
  'layer-deleted': ({ layerId }) => delete state[layerId],
  'layer-hidden': ({ layerId }) => (state[layerId].show = false),
  'layer-shown': ({ layerId }) => (state[layerId].show = true),
  'feature-added': ({ layerId, featureId, feature }) => (state[layerId].features[featureId] = feature),
  'feature-updated': ({ layerId, featureId, feature }) => (state[layerId].features[featureId] = feature),
  'feature-deleted': ({ layerId, featureId }) => delete state[layerId].features[featureId]
}

const reduce = event => {
  eventCount += 1
  const handler = handlers[event.type]
  if (handler) return handler(event)
  else console.log('[layer-store] unhandled', event)
}

const persist = event => {
  db.put(`layer:journal:${now()}`, event)
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

setInterval(() => {
  if (eventCount > 500) {
    db.put(`layer:snapshot:${now()}`, state)
    eventCount = 0
  }
}, 5 * 60 * 1000)

const replaySnapshot = () => new Promise((resolve, reject) => {
  let timestamp

  const handleSnapshot = ({ key, value: snapshot }) => {
    timestamp = key.split(':')[2]
    state = snapshot
  }

  db.createReadStream({
    gte: 'layer:snapshot',
    lte: 'layer:snapshot\xff',
    keys: true,
    reverse: true,
    limit: 1
  }).on('data', handleSnapshot)
    .on('end', () => resolve(timestamp))
    .on('error', err => reject(err))
})

replaySnapshot().then(timestamp => {
  db.createReadStream({
    gte: `layer:journal:${timestamp || ''}`,
    lte: 'layer:journal:\xff',
    keys: false
  }).pipe(recoverStream(reduce))
})

evented.ready = () => ready
evented.state = () => state

// Add new or replace existing layer.
evented.addLayer = (layerId, name) => {
  // Delete layer with same name, if one exists:
  const existing = Object.entries(state).find(([_, layer]) => layer.name === name)
  if (existing) persist({ type: 'layer-deleted', layerId: existing[0] })
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
    persist({ type: 'layer-added', layerId: '0', name: 'Default Layer', show: true })
  }

  // Implicitly show layer when currently hidden.
  if (!state[layerId].show) persist({ type: 'layer-shown', layerId })

  // Feature already exists -> bail out.
  if (state[layerId].features[featureId]) return
  persist({ type: 'feature-added', layerId, featureId, feature })
}

evented.updateFeature = layerId => (featureId, feature) => {
  // NOTE: Allows for partial updates:
  persist({
    type: 'feature-updated',
    layerId,
    featureId,
    feature: { ...state[layerId].features[featureId], ...feature }
  })
}

evented.deleteFeature = layerId => featureId => {
  if (!state[layerId]) return
  if (!state[layerId].features[featureId]) return
  persist({ type: 'feature-deleted', layerId, featureId })
}

evented.layer = layerId => state[layerId]
evented.feature = (layerId, featureId) => state[layerId].features[featureId]

// Command API ==>

const commands = {}
evented.commands = commands

commands.updateGeometry = (layerId, featureId) => geometry => {
  // Capture current situation:
  const snapshot = evented.feature(layerId, featureId)
  const currentGeometry = R.clone(snapshot.geometry)

  const command = (currentGeometry, geometry) => ({
    run: () => evented.updateFeature(layerId)(featureId, { ...snapshot, geometry }),
    inverse: () => command(geometry, currentGeometry)
  })

  return command(currentGeometry, geometry)
}

// Clipboard handlers ==>

clipboard.register('feature', {
  properties: urn => {
    const [layerId, featureId] = urn.split(':').slice(2)
    return R.clone(state[layerId].features[featureId])
  },
  'delete': urn => {
    const [layerId, featureId] = urn.split(':').slice(2)
    evented.deleteFeature(layerId)(featureId)
  },
  paste: feature => evented.addFeature(0)(uuid(), feature)
})

ipcRenderer.on('COMMAND_LOAD_LAYER', (_, name, content) => {
  evented.add(name, content)
})

export default evented

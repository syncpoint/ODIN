/* eslint-disable */

import { Writable } from 'stream'
import EventEmitter from 'events'
import { ipcRenderer } from 'electron'
import uuid from 'uuid-random'
import { db } from './db'

const evented = new EventEmitter()
const state = {}
let ready = false

const reduce = ({ key, value }) => {
  const name = key.match(/layer:(.*)/)[1]
  state[name] = value
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
  keys: true
}).pipe(recoverStream(reduce))

evented.ready = () => ready
evented.state = () => state

// strategy (pessimistic): update state, save, emit event on completion
evented.add = (name, content) => {
  const layer = { show: true, content }

  // Add unique feature ids if none are provided.
  content.features
    .filter(feature => !feature.id)
    .forEach(feature => (feature.id = uuid()))

  const event = state[name] ? 'replaced' : 'added'
  state[name] = layer
  db.put(`layer:${name}`, layer).then(() => evented.emit(event, { name, layer }))
}

evented.remove = name => {
  if (!state[name]) return
  delete state[name]
  db.del(`layer:${name}`).then(() => evented.emit('removed', { name }))
}

evented.hide = name => {
  const layer = state[name]
  if (!layer) return
  if (!layer.show) return

  layer.show = false
  db.put(`layer:${name}`, layer).then(() => evented.emit('hidden', { name }))
}

evented.show = name => {
  const layer = state[name]
  if (!layer) return
  if (layer.show) return

  layer.show = true
  db.put(`layer:${name}`, layer).then(() => evented.emit('shown', { name, layer }))
}

evented.removeAll = names => (names || Object.keys(state)).forEach(evented.remove)
evented.hideAll = names => (names || Object.keys(state)).forEach(evented.hide)
evented.showAll = names => (names || Object.keys(state)).forEach(evented.show)

evented.updateGeometry = (name, id, latlngs) => {
  if (!state[name]) return
  const layer = state[name]
  const features = layer.content.features
  const index = features.findIndex(feature => feature.id === id)
  if (index === -1) return

  switch (features[index].geometry.type) {
    case 'Point':
      features[index].geometry.coordinates = [latlngs[0].lng, latlngs[0].lat]
      break
    case 'LineString':
      features[index].geometry.coordinates = latlngs.map(({ lat, lng }) => ([lng, lat]))
      break
    case 'Polygon':
      // TODO: support multiple rings
      const xs = latlngs[0].map(({ lat, lng }) => ([lng, lat]))
      features[index].geometry.coordinates = [[ ...xs, xs[0]]]
      break
  }

  db.put(`layer:${name}`, layer).then(() => {})
}

ipcRenderer.on('COMMAND_LOAD_LAYER', (_, name, content) => {
  evented.add(name, content)
})

export default evented

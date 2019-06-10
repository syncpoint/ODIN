/* eslint-disable */

import { Writable } from 'stream'
import EventEmitter from 'events'
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

evented.add = (name, content) => {
  const layer = { show: true, content }
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

export default evented

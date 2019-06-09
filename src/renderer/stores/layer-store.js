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
evented.state = () => ({ ...state })

evented.add = (name, file) => {
  db.put(`layer:${name}`, file)
  evented.emit('added', { name, file })
}

evented.remove = name => {
  db.del(`layer:${name}`)
  evented.emit('removed', { name })
}

export default evented

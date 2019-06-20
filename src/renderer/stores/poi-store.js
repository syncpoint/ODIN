import { Writable } from 'stream'
import EventEmitter from 'events'
import now from 'nano-time'
import { db } from './db'

const evented = new EventEmitter()
const reducers = []
const state = {}
let ready = false

const handlers = {
  added: ({ uuid, ...poi }) => (state[uuid] = poi),
  moved: ({ uuid, lat, lng }) => (state[uuid] = { ...state[uuid], lat, lng }),
  updated: ({ uuid, latlngs }) => (state[uuid] = { ...state[uuid], latlngs }),
  renamed: ({ uuid, name }) => (state[uuid].name = name),
  removed: ({ uuid }) => delete state[uuid],
  commented: ({ uuid, comment }) => (state[uuid].comment = comment)
}

const reduce = ({ type, ...event }) => (handlers[type] || (() => {}))(event)

// Strategy (optimistic): save (fire and forget), update state, emit event
const persist = ({ type, ...event }) => {
  db.put(`journal:poi:${now()}`, { type, ...event })
  reduce({ type, ...event })
  evented.emit(type, event)
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

// recover journal events:
const recover = reducer => db.createReadStream({
  gte: 'journal:poi',
  lte: 'journal:poi\xff',
  keys: false
}).pipe(recoverStream(reducer))


// TODO: at some point, `ready` and `state` should no longer be necessary
evented.ready = () => ready
evented.state = () => ({ ...state })

evented.register = reducer => {
  recover(reducer)
  reducers.push(reducer)
}

// TODO: rename type -> event
evented.add = (uuid, poi) => persist({ type: 'added', uuid, ...poi })

evented.remove = uuid => {
  if (!state[uuid]) return
  persist({ type: 'removed', uuid })
}

evented.move = uuid => x => {
  if (!state[uuid]) return
  const { lat, lng } = x
  persist({ type: 'moved', uuid, lat, lng })
}

evented.update = uuid => latlngs => {
  if (!state[uuid]) return
  persist({ type: 'updated', uuid, latlngs })
}

evented.rename = (uuid, name) => {
  if (!state[uuid]) return
  if (state[uuid].name === name) return
  persist({ type: 'renamed', uuid, ...state[uuid], name })
}

evented.comment = (uuid, comment) => {
  if (!state[uuid]) return
  persist({ type: 'commented', uuid, comment })
}

recover(reduce)

export default evented

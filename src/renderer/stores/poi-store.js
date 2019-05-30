import EventEmitter from 'events'
import { Writable } from 'stream'
import level from 'level'
import now from 'nano-time'

const store = level('poi-db', { valueEncoding: 'json' })
const evented = new EventEmitter()

let model = {}

const deleteStream = options => {
  const batch = store.batch()
  const key = (options && options.key) || (chunk => chunk)

  return new Writable({
    objectMode: true,
    write (chunk, _, callback) {
      batch.del(key(chunk))
      callback()
    },
    final (callback) {
      console.log('flushing batch...')
      batch.write(callback)
    }
  })
}

const reducer = value => {
  switch (value.event) {
    case 'added': return (model[value.poi.id] = { lat: value.poi.lat, lng: value.poi.lng })
    case 'removed': return delete model[value.id]
    case 'moved': return (model[value.id] = { lat: value.lat, lng: value.lng })
    default: console.log('unhandled', value)
  }
}

const recoverStream = () => new Writable({
  objectMode: true,
  write (chunk, _, callback) {
    this.now = this.now || Date.now()
    reducer(chunk)
    callback()
  },
  final (callback) {
    evented.emit('ready', model)
    callback()
  }
})


store.on('put', (_, value) => {
  switch (value.event) {
    case 'added': return evented.emit('added', value.poi)
    case 'removed': return evented.emit('removed', value.id)
    case 'moved': break
  }
})

store.createReadStream({
  gte: 'journal:',
  lte: 'journal:\xff',
  keys: false
}).pipe(recoverStream())

const put = event => store.put(`journal:${now()}`, event)

evented.add = poi => {
  const value = { event: 'added', poi }
  reducer(value)
  put(value)
}

evented.remove = id => {
  if (!model[id]) return
  const value = { event: 'removed', id }
  reducer(value)
  put(value)
}

evented.move = (id, latlng) => {
  if (!model[id]) return
  const { lat, lng } = latlng
  const value = { event: 'moved', id, lat, lng }
  reducer(value)
  put(value)
}

evented.clean = () => {
  store.createReadStream().pipe(deleteStream({ key: chunk => chunk.key }))
  model = {}
  evented.emit('cleaned')
}

evented.model = () => model

export default evented

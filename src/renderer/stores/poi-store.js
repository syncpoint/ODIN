import EventEmitter from 'events'
import { Writable } from 'stream'
import level from 'level'
import now from 'nano-time'

// TODO: POI should have stable UUID as identifier (aggregate id)

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
      batch.write(callback)
    }
  })
}

const reducer = value => {
  switch (value.event) {
    case 'added': return (model[value.poi.id] = { lat: value.poi.lat, lng: value.poi.lng })
    case 'removed': return delete model[value.id]
    // TODO: propertyChanged event
    // TODO: combine lat/lng as latlng or position
    case 'moved': return (model[value.id] = { lat: value.lat, lng: value.lng })

    // TODO: propertyChanged event
    case 'renamed':
      model[value.id] = { ...model[value.previousId], id: value.id }
      delete model[value.previousId]
      break

    // TODO: propertyChanged event
    case 'commented': return (model[value.id] = { ...model[value.id], comment: value.comment })
    default: console.log('unhandled', value)
  }
}

const recoverStream = () => new Writable({
  objectMode: true,
  write (chunk, _, callback) {
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
    case 'renamed': return evented.emit('renamed', value.previousId, model[value.id])
    case 'commented': return evented.emit('commented', model[value.id])
    case 'moved': break
  }
})

// recover journal events:
store.createReadStream({
  gte: 'journal:',
  lte: 'journal:\xff',
  keys: false
}).pipe(recoverStream())

// TODO: introduce aggregate id to make it possible to delete events for a removed aggregate
// TODO: support snapshots
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

evented.rename = (previousId, id) => {
  if (model[previousId]) {
    const event = { event: 'renamed', previousId: previousId, id }
    reducer(event)
    put(event)
  }
}

evented.comment = (id, comment) => {
  if (model[id]) {
    const event = { event: 'commented', id, comment }
    reducer(event)
    put(event)
  }
}

evented.clean = () => {
  store.createReadStream().pipe(deleteStream({ key: chunk => chunk.key }))
  model = {}
  evented.emit('cleaned')
}

evented.model = () => model

export default evented

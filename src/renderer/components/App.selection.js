import EventEmitter from 'events'

const evented = new EventEmitter()

const select = object => {
  evented.emit('selected', object)
}

const deselect = () => {
  evented.emit('deselected')
}

export default {
  evented,
  select,
  deselect
}

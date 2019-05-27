import EventEmitter from 'events'

const evented = new EventEmitter()
let selected

evented.select = object => {
  selected = object
  evented.emit('selected', object)
}

evented.deselect = () => {
  selected = undefined
  evented.emit('deselected')
}

evented.selected = () => selected

export default evented

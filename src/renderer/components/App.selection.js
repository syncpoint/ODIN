import EventEmitter from 'events'

const evented = new EventEmitter()
let selected

evented.select = object => {
  if (selected) evented.emit('deselected', selected)
  selected = object
  evented.emit('selected', object)
}

evented.deselect = () => {
  if (!selected) return
  evented.emit('deselected', selected)
  selected = undefined
}

evented.selected = () => selected

export default evented

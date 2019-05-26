import EventEmitter from 'events'

const selection = new EventEmitter()

selection.select = object => {
  selection.emit('selected', object)
}

selection.deselect = () => {
  selection.emit('deselected')
}

export default selection

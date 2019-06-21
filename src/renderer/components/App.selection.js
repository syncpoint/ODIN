import EventEmitter from 'events'

const evented = new EventEmitter()
evented.setMaxListeners(0)

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

evented.selected = type => {
  if (!type) return [selected]
  else return (selected && selected.type === type) ? [selected] : []
}

evented.empty = () => !selected

export default evented

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
  const tmp = selected
  selected = undefined
  evented.emit('deselected', tmp)
}

evented.selected = type => {
  if (!type) return selected ? [selected] : []
  else return (selected && selected.type === type) ? [selected] : []
}

evented.isSelected = object => selected === object

evented.empty = () => !selected

export default evented

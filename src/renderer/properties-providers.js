import EventEmitter from 'events'
import selection from './selection'
import { I } from '../shared/combinators'

const evented = new EventEmitter()

let providers = []

evented.register = provider => (providers = [...providers, provider])
evented.deregister = provider => (providers = providers.filter(x => x !== provider))

const selectionUpdated = () => {
  const selected = selection.selected()
  const panels = providers
    .flatMap(p => p(selected))
    .filter(I)

  if (panels.length !== 1) evented.emit('selected', null)
  else evented.emit('selected', panels[0])
}

selection.on('selected', selectionUpdated)
selection.on('deselected', selectionUpdated)

export default evented

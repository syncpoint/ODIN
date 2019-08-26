import Mousetrap from 'mousetrap'
import selection from './App.selection'
import { ResourceNames } from '../model/identifiers'
import * as R from 'ramda'

let memory = [] // urn[]
const handlers = {} // nid -> handler

const copySelection = () => {
  memory = selection.selected().map(urn => {
    const nid = ResourceNames.nid(urn)
    return [nid, handlers[nid] && handlers[nid].properties && handlers[nid].properties(urn)]
  })
}

const deleteSelection = () => {
  selection.selected().forEach(urn => {
    const nid = ResourceNames.nid(urn)
    handlers[nid] && handlers[nid].delete && handlers[nid].delete(urn)
  })
}

const pasteSelection = () => {
  memory.forEach(([nid, properties]) => handlers[nid] && handlers[nid].paste && handlers[nid].paste(properties))
}

Mousetrap.bind(['del', 'command+backspace'], deleteSelection)
Mousetrap.bind('mod+c', copySelection)
Mousetrap.bind('mod+x', R.compose(deleteSelection, copySelection))
Mousetrap.bind('mod+v', pasteSelection)

export const clipboard = {
  register: (nid, handler) => (handlers[nid] = handler)
}

import Mousetrap from 'mousetrap'
import selection from './App.selection'

let memory = {}

const copySelection = () => {
  if (selection.empty()) return
  memory = selection.selected()
    .filter(selected => selected.copy)
    .map(selected => ({
      object: selected.copy(),
      paste: selected.paste
    }))
}

const deleteSelection = () => {
  selection.selected()
    .filter(selected => selected.delete)
    .forEach(selected => {
      selection.deselect()
      selected.delete()
    })
}

Mousetrap.bind(['del', 'command+backspace'], _ => {
  deleteSelection()
})

Mousetrap.bind('mod+c', _ => {
  copySelection()
})

Mousetrap.bind('mod+x', _ => {
  copySelection()
  deleteSelection()
})

Mousetrap.bind('mod+v', _ => {
  if (!memory || !memory.forEach) return
  memory.forEach(({ object, paste }) => paste(object))
})


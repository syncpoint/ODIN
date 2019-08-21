import Mousetrap from 'mousetrap'
import selection from './App.selection'

let memory = {}

Mousetrap.bind(['del', 'command+backspace'], _ => {
  selection.selected()
    .filter(selected => selected.delete)
    .forEach(selected => {
      selection.deselect()
      selected.delete()
    })
})

Mousetrap.bind('mod+c', _ => {
  if (selection.empty()) return
  memory = selection.selected().map(selected => ({
    properties: selected.properties(),
    paste: selected.paste
  }))

  selection.selected()
    .filter(selected => selected.delete)
    .forEach(selected => selected.delete())
})

Mousetrap.bind('mod+x', _ => {
  if (selection.empty()) return
  memory = selection.selected().map(selected => ({
    properties: selected.properties(),
    paste: selected.paste
  }))
})

Mousetrap.bind('mod+v', _ => {
  memory.forEach(({ properties, paste }) => paste(properties))
})


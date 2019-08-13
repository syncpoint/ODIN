import selection from './App.selection'

let memory = {}

const copy = () => {
  if (selection.empty()) return
  memory = selection.selected().map(selected => ({
    properties: selected.properties(),
    paste: selected.paste
  }))
}

const cut = () => {
  if (selection.empty()) return
  memory = selection.selected().map(selected => ({
    properties: selected.properties(),
    paste: selected.paste
  }))

  selection.selected()
    .filter(selected => selected.delete)
    .forEach(selected => selected.delete())
}

const paste = () => {
  memory.forEach(({ properties, paste }) => paste(properties))
}

export default {
  copy, cut, paste
}

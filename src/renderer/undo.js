import Mousetrap from 'mousetrap'

// TODO: reset buffers on project close/open

let undo = []
let redo = []

Mousetrap.bind('mod+z', _ => {
  const [head, ...tail] = undo
  if (!head) return
  head.apply()
  undo = tail
  redo.unshift(head.inverse())
})

Mousetrap.bind('mod+shift+z', _ => {
  const [head, ...tail] = redo
  if (!head) return
  head.apply()
  redo = tail
  undo.unshift(head.inverse())
})

export default {
  push: command => undo.unshift(command)
}

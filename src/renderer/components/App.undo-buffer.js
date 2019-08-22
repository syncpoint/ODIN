import Mousetrap from 'mousetrap'

const stack = () => {
  const buffer = []
  let head = 0 // insert position

  return {
    push: element => (buffer[head++] = element),
    pop: () => buffer[--head],
    peek: () => buffer[head - 1],
    length: () => head
  }
}

const undoStack = stack()
const redoStack = stack()

const buffer = {
  push: command => undoStack.push(command.inverse()),
  undo: () => {
    if (!undoStack.length()) return
    undoStack.peek().run()
    redoStack.push(undoStack.pop().inverse())
  },
  redo: () => {
    if (!redoStack.length()) return
    redoStack.peek().run()
    undoStack.push(redoStack.pop.inverse())
  }
}

Mousetrap.bind('mod+z', _ => buffer.undo())
Mousetrap.bind('mod+shift+z', _ => buffer.redo())

export default buffer


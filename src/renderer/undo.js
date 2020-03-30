// TODO: reset buffers on project close/open

const MAX_STACK = 32
let undoStack = []
let redoStack = []

export const undo = () => {
  const [head, ...tail] = undoStack
  if (!head) return
  head.apply()
  undoStack = tail
  redoStack.unshift(head.inverse())
  redoStack.splice(MAX_STACK)
}

export const redo = () => {
  const [head, ...tail] = redoStack
  if (!head) return
  head.apply()
  redoStack = tail
  undoStack.unshift(head.inverse())
  undoStack.splice(MAX_STACK)
}

/**
 * NOTE: Command#apply() is expected to undo last change.
 * @param {object} command inversable command
 */
export const push = command => {
  undoStack.unshift(command)
  undoStack.splice(MAX_STACK)
}

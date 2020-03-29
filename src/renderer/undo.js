// TODO: reset buffers on project close/open

let undoStack = []
let redoStack = []

export const undo = () => {
  const [head, ...tail] = undoStack
  if (!head) return
  head.apply()
  undoStack = tail
  redoStack.unshift(head.inverse())
}

export const redo = () => {
  const [head, ...tail] = redoStack
  if (!head) return
  head.apply()
  redoStack = tail
  undoStack.unshift(head.inverse())
}

/**
 * NOTE: Command#apply() is expected to undo last change.
 * @param {object} command inversable command
 */
export const push = command => undoStack.unshift(command)

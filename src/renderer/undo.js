// TODO: reset buffers on project close/open

const MAX_STACK = 32
let undoStack = []
let redoStack = []

const assertCommand = command => {
  if (!command) throw new Error('undefined command')

  if (typeof command.apply !== 'function') {
    throw new Error("invalid command; missing 'apply' function")
  }

  if (typeof command.inverse !== 'function') {
    throw new Error("invalid command; missing 'inverse' function")
  }

  return command
}


/**
 * Push command unto stack and limit stack size.
 */
const unshift = (stack, command) => {
  stack.unshift(command)
  stack.splice(MAX_STACK)
}


/**
 * Apply command from first stack and
 * move inverse command to other stack.
 */
const shift = ([head, ...tail], to) => {
  if (!head) return []
  head.apply()
  unshift(to, assertCommand(head.inverse()))
  return tail
}


/**
 * Invoke apply() function of topmost command on undo stack.
 * Push inverse command unto redo stack.
 */
const undo = () => (undoStack = shift(undoStack, redoStack))


/**
 * Invoke apply() function of topmost command on redo stack.
 * Push inverse command unto redo stack.
 */
const redo = () => (redoStack = shift(redoStack, undoStack))


/**
 * Push a command unto the undo stack.
 *
 * Command object must conform to the following properties:
 * - command#apply() - reverts changes of the command
 * - command#inverse() - yields valid inverse of command
 */
const push = command => unshift(undoStack, assertCommand(command))


/**
 * Clear undo/redo stacks.
 */
const clear = () => {
  undoStack = []
  redoStack = []
}

const canUndo = () => undoStack.length > 0
const canRedo = () => redoStack.length > 0

export default {
  push,
  clear,
  undo,
  redo,
  canUndo,
  canRedo
}

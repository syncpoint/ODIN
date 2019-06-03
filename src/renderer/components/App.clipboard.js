import Mousetrap from 'mousetrap'
import { clipboard } from 'electron'

const handlers = []

const registerHandler = handler => {
  handlers.push(handler)
}

Mousetrap.bind(['mod+v'], () => {
  const text = clipboard.readText()
  if (!text) return

  for (let index in handlers) {
    const handler = handlers[index]
    if (!handler.paste) continue
    handler.paste(text)
  }
})

Mousetrap.bind(['mod+z'], () => handlers.forEach(handler => handler.undo()))
Mousetrap.bind(['mod+shift+z'], () => handlers.forEach(handler => handler.redo()))

export default {
  registerHandler
}

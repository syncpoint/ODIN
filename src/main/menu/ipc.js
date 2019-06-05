export const sendMessage = (event, ...args) => (_, focusedWindow) => {
  if (!focusedWindow) return
  focusedWindow.send(event, ...args)
}

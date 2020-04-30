import evented from './evented'

const activeElement = () => document.activeElement
const mapFocused = () => activeElement().id === 'map'

document.addEventListener('cut', () => {
  if (mapFocused()) evented.emit('EDIT_CUT')
})

document.addEventListener('copy', () => {
  if (mapFocused()) evented.emit('EDIT_COPY')
})

document.addEventListener('paste', () => {
  if (mapFocused()) evented.emit('EDIT_PASTE')
})

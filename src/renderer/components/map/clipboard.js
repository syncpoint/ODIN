import { clipboard } from 'electron'
import evented from '../../evented'
import formatLatLng from '../../coord-format'

export const COMMAND_COPY_COORDS = ({ map }) => () => {
  const container = document.getElementById('map')
  const originalCursor = container.style.cursor

  const onClick = event => {
    container.style.cursor = originalCursor
    map.off('click', onClick)
    clipboard.writeText(formatLatLng(event.latlng))
    const originalFilter = container.style.filter
    const reset = () => (container.style.filter = originalFilter)
    container.style.filter = 'invert(100%)'
    setTimeout(reset, 50)
    evented.emit('OSD_MESSAGE', { message: `Coordinates Copied`, duration: 1500 })
  }

  if (container.style.cursor === '') {
    container.style.cursor = 'crosshair'
    map.on('click', onClick)
  }
}

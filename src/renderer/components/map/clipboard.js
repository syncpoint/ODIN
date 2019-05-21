import { clipboard } from 'electron'
import L from 'leaflet'
import evented from '../../evented'
import formatLatLng from '../../coord-format'

export const COMMAND_COPY_COORDS = ({ map }) => () => {
  const container = document.getElementById('map')
  const originalCursor = container.style.cursor

  const onClick = event => {
    container.style.cursor = originalCursor
    container.removeEventListener('click', onClick)

    const pointXY = L.point(event.layerX, event.layerY)
    const latlng = map.layerPointToLatLng(pointXY).wrap()
    clipboard.writeText(formatLatLng(latlng))
    const originalFilter = container.style.filter
    const reset = () => (container.style.filter = originalFilter)
    container.style.filter = 'invert(100%)'
    setTimeout(reset, 50)
    evented.emit('OSD_MESSAGE', { message: `Coordinates copied`, duration: 1500 })
  }

  if (container.style.cursor === '') {
    container.style.cursor = 'crosshair'
    container.addEventListener('click', onClick)
  }
}

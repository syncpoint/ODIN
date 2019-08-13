import { clipboard } from 'electron'
import coord from '../../coord-format'

export const COMMAND_COPY_COORDS = ({ map }) => () => map.tools.pickPoint({
  prompt: 'Pick a location...',
  message: 'Coordinates copied.',
  picked: latlng => clipboard.writeText(coord.format(latlng))
})

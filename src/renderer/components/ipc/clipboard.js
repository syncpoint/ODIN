import { clipboard } from 'electron'
import coord from '../../coord-format'
import mouseInput from '../map/mouse-input'

export const COMMAND_COPY_COORDS = () => () => mouseInput.pickPoint({
  prompt: 'Pick a location...',
  message: 'Coordinates copied.',
  picked: latlng => clipboard.writeText(coord.format(latlng))
})

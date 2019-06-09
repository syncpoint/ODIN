import uuid from 'uuid-random'
import store from '../../stores/poi-store'
import mouseInput from '../map/mouse-input'

export const COMMAND_NEW_POI = () => () => {
  mouseInput.pickPoint({
    prompt: 'Pick a location...',
    picked: latlng => {
      store.add(uuid(), { ...latlng })
    }
  })
}

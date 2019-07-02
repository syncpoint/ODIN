import uuid from 'uuid-random'
import store from '../../stores/poi-store'
import mouseInput from '../map/mouse-input'
import selection from '../App.selection'

export const COMMAND_NEW_POI = () => () => {
  mouseInput.pickPoint({
    prompt: 'Pick a location...',
    picked: latlng => {
      store.add(uuid(), { ...latlng })
    }
  })
}


const area = sidc => ({ map }) => () => {
  map.pm.disableGlobalEditMode()
  selection.deselect()

  const onCreate = ({ layer }) => {
    store.add(uuid(), { latlngs: layer._latlngs, sidc })
    layer.remove(map)
  }

  const options = {
    tooltips: false,
    cursorMarker: true, // does not seem to work without a marker
    templineStyle: { color: 'red', weight: 2 },
    hintlineStyle: { color: 'red', weight: 2, dashArray: [5, 5] },
    finishOn: 'dblclick'
  }

  // Remove creation listener, once edit mode was canceled.
  map.once('pm:globaleditmodetoggled', ({ enabled }) => {
    if (!enabled) map.off('pm:create', onCreate)
  })

  map.once('pm:create', onCreate)
  map.pm.enableDraw('Polygon', options)
}

export const COMMAND_NEW_NAI = area('GFGPSAN--------')
export const COMMAND_NEW_TAI = area('GFGPSAT--------')

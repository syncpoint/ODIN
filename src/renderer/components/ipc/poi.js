import uuid from 'uuid-random'
import store from '../../stores/poi-store'

export const COMMAND_NEW_POI = ({ map }) => () => map.tools.pickPoint({
  prompt: 'Pick a location...',
  picked: latlng => {
    const id = uuid()
    store.add(id, { ...latlng })
  }
})

const area = sidc => ({ map }) => () => {
  const create = ({ layer }) => {
    layer.remove(map)
    store.add(uuid(), { latlngs: layer._latlngs, sidc })
  }

  map.tools.draw('Polygon', {
    create,
    tooltips: false,
    cursorMarker: true, // does not seem to work without a marker
    templineStyle: { color: 'red', weight: 2 },
    hintlineStyle: { color: 'red', weight: 2, dashArray: [5, 5] },
    finishOn: 'dblclick'
  })
}

export const COMMAND_NEW_NAI = area('GFGPSAN--------')
export const COMMAND_NEW_TAI = area('GFGPSAT--------')

import L from 'leaflet'
import { K } from '../../../shared/combinators'
import { FULCRUM, MIDWAY } from './handle-types'

export const polyEditor = (latlngs, layer, list, callback) => {
  const handleOptions = {}

  const midpoint = (a, b) => L.LatLng.midpoint([a.getLatLng(), b.getLatLng()])
  const fulcrums = () => list.filter(handle => handle.type === FULCRUM)
  const emit = channel => {
    const latlngs = fulcrums().map(handle => handle.getLatLng())
    callback(channel, latlngs)
  }

  const insertMidways = handle => {
    const succ = layer.addHandle(midpoint(handle, handle.succ), handleOptions[MIDWAY])
    list.append(succ, handle)
    const pred = layer.addHandle(midpoint(handle, handle.pred), handleOptions[MIDWAY])
    list.prepend(pred, handle)
  }

  const alignMidways = () => fulcrums()
    .map(mainHandle => [mainHandle, mainHandle.succ])
    .filter(([_, middleHandle]) => middleHandle)
    .map(([mainHandle, middleHandle]) => [middleHandle, midpoint(mainHandle, middleHandle.succ)])
    .forEach(([middleHandle, latlng]) => middleHandle.setLatLng(latlng))

  const removeFulcrum = (handle, originalEvent) => {
    const pointCount = fulcrums().length
    if (pointCount === 2) return
    if (!originalEvent.ctrlKey) return

    ;[handle.succ ? handle.succ : handle.pred, handle].forEach(handle => {
      layer.removeHandle(handle)
      list.remove(handle)
    })
  }

  handleOptions[FULCRUM] = {
    type: FULCRUM,
    mousedown: ({ target: handle, originalEvent }) => {
      removeFulcrum(handle, originalEvent)
      alignMidways(); emit('dragend')
    },
    drag: () => { alignMidways(); emit('drag') },
    dragend: () => emit('dragend')
  }

  handleOptions[MIDWAY] = {
    type: MIDWAY,
    drag: ({ target: handle }) => {
      // Upgrade handle options (MIDWAY -> FULCRUM) and
      // insert new MIDWAY handles before and after:
      layer.updateHandle(handle, handleOptions[FULCRUM])
      insertMidways(handle)
    }
  }

  // Create markers:

  latlngs
    .map(latlng => layer.addHandle(latlng, handleOptions[FULCRUM]))
    .reduce((acc, handle) => K(acc)(acc => acc.append(handle)), list)

  fulcrums()
    .filter(marker => marker.succ)
    .map(fulcrum => [fulcrum, midpoint(fulcrum, fulcrum.succ)])
    .map(([fulcrum, latlng]) => [fulcrum, layer.addHandle(latlng, handleOptions[MIDWAY])])
    .reduce((acc, [fulcrum, midway]) => K(acc)(acc => acc.append(midway, fulcrum)), list)
}

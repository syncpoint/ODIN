import L from 'leaflet'
import { K } from '../../../shared/combinators'
import { FULCRUM, MIDWAY } from './handle-types'
import { circularDoublyLinkedList, doublyLinkedList } from '../../../shared/lists'

export const polyEditor = (latlngs, layer, options) => callback => {
  const handleOptions = {}

  const list = options.closed ? circularDoublyLinkedList() : doublyLinkedList()
  const midpoint = (a, b) => L.LatLng.midpoint([a.getLatLng(), b.getLatLng()])
  const fulcrums = () => list.filter(handle => handle.type === FULCRUM)

  const emit = channel => {
    const latlngs = fulcrums().map(handle => handle.getLatLng())
    if (options.closed) latlngs.push(latlngs[0])
    callback(channel, latlngs)
  }

  const insertMidways = handle => {
    const succ = layer.addHandle(midpoint(handle, handle.succ), handleOptions[MIDWAY])
    list.append(succ, handle)
    const pred = layer.addHandle(midpoint(handle, handle.pred), handleOptions[MIDWAY])
    list.prepend(pred, handle)
  }

  const alignMidways = () => {
    if (!options.midways) return

    fulcrums()
      .map(mainHandle => [mainHandle, mainHandle.succ])
      .filter(([_, middleHandle]) => middleHandle)
      .map(([mainHandle, middleHandle]) => [middleHandle, midpoint(mainHandle, middleHandle.succ)])
      .forEach(([middleHandle, latlng]) => middleHandle.setLatLng(latlng))
  }

  handleOptions[FULCRUM] = {
    type: FULCRUM,
    mousedown: ({ target: handle, originalEvent }) => {
      if (!originalEvent.ctrlKey) return
      if (options.closed && fulcrums().length === 3) return
      if (fulcrums().length === 2) return

      // Remove fulcrum and preceding or following midway handle.
      ;[handle.succ ? handle.succ : handle.pred, handle].forEach(handle => {
        layer.removeHandle(handle)
        list.remove(handle)
      })

      alignMidways()
      emit('dragend')
    },
    drag: () => {
      const valid = options.valid
        ? options.valid(fulcrums().map(handle => handle.getLatLng()))
        : true

      if (!valid) return
      alignMidways()
      emit('drag')
    },
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

  const xs = options.closed ? latlngs.slice(0, latlngs.length - 1) : latlngs
  xs.map(latlng => layer.addHandle(latlng, handleOptions[FULCRUM]))
    .reduce((acc, handle) => K(acc)(acc => acc.append(handle)), list)

  if (options.midways) {
    fulcrums()
      .filter(marker => marker.succ)
      .map(fulcrum => [fulcrum, midpoint(fulcrum, fulcrum.succ)])
      .map(([fulcrum, latlng]) => [fulcrum, layer.addHandle(latlng, handleOptions[MIDWAY])])
      .reduce((acc, [fulcrum, midway]) => K(acc)(acc => acc.append(midway, fulcrum)), list)
  }
}

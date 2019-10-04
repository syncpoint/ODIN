import { FULCRUM } from './handle-types'
import { corridorGeometry } from './corridor-geometry'

export const widthEditor = (corridor, layer, events) => {

  const width = handle => {
    const distance = handle.getLatLng().distanceTo(corridor.latlngs[0])
    return distance * 2
  }

  const update = (latlngs = corridor.latlngs, width = corridor.width) => {
    corridor = corridorGeometry(latlngs, width)

    const tip = corridor.envelope()[0]
    A1.setLatLng(tip[0])
    A2.setLatLng(tip[1])
    return corridor
  }

  const handleOptions = {
    type: FULCRUM,
    drag: ({ target }) => events('drag', update(corridor.latlngs, width(target))),
    dragend: ({ target }) => events('dragend', update(corridor.latlngs, width(target)))
  }

  const tip = corridor.envelope()[0]
  const A1 = layer.addHandle(tip[0], handleOptions)
  const A2 = layer.addHandle(tip[1], handleOptions)

  return update
}

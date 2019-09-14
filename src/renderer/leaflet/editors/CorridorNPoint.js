import { Readable } from 'stream'
import L from 'leaflet'
import { K } from '../../../shared/combinators'
import disposable from '../../../shared/disposable'
import { doublyLinkedList } from '../../../shared/lists'
import { handleMarker, midpointMarker } from './Markers'

export const corridorNPointEditor = shape => (map, geometry) => {
  const disposables = disposable.of()
  const geometries = new Readable({ objectMode: true, read: () => {} })
  const markerGroup = K(new L.LayerGroup())(layer => map.addLayer(layer))
  disposables.addDisposable(() => map.removeLayer(markerGroup))
  const renderer = map.getRenderer(markerGroup)

  const markers = doublyLinkedList()
  const moveMarkers = () => markers.filter(marker => !marker.midpoint)
  const widthMarkers = {}

  const { dispose: disposeShape, update: updateShape } = shape(map, renderer, geometry)
  disposables.addDisposable(disposeShape)
  disposables.addDisposable(() => markers.forEach(marker => markerGroup.removeLayer(marker)))

  const dragHandler = () => {
    const latlngs = moveMarkers().map(marker => marker.getLatLng())

    geometry = geometry.update(latlngs)
    updateShape(geometry)
    geometries.push(geometry)

    // Update midpoint markers:
    moveMarkers()
      .filter(marker => marker.succ)
      .forEach(marker => {
        const latlng = L.LatLng.midpoint([marker.getLatLng(), marker.succ.succ.getLatLng()])
        if (!marker.succ.midpoint) return
        marker.succ.setLatLng(latlng)
      })

    geometry.points((id, latlng) => widthMarkers[id].setLatLng(latlng))
  }

  geometry.latlngs.forEach(latlng => {
    const marker = handleMarker(dragHandler)(latlng).addTo(markerGroup)
    markers.append(marker)
  })

  const addHandler = ({ target }) => {
    target.midpoint = false // reset flag
    L.DomUtil.removeClass(target._icon, 'marker-icon-middle')
    target.off('drag', addHandler)
    target.on('drag', dragHandler)

    const succLatlng = L.LatLng.midpoint([target.getLatLng(), target.succ.getLatLng()])
    const succ = midpointMarker(addHandler)(succLatlng).addTo(markerGroup)
    markers.append(succ, target)

    const predLatlng = L.LatLng.midpoint([target.getLatLng(), target.pred.getLatLng()])
    const pred = midpointMarker(addHandler)(predLatlng).addTo(markerGroup)
    markers.prepend(pred, target)
  }

  moveMarkers()
    .filter(marker => marker.succ)
    .forEach(marker => {
      const latlng = L.LatLng.midpoint([marker.getLatLng(), marker.succ.getLatLng()])
      const midpoint = midpointMarker(addHandler)(latlng).addTo(markerGroup)
      markers.append(midpoint, marker)
    })

  // Two additional handles to change width:
  const widthHandler = id => ({ latlng }) => {
    geometry = geometry.updateWidth(id, latlng)
    updateShape(geometry)
    geometries.push(geometry)
    geometry.points((id, latlng) => widthMarkers[id].setLatLng(latlng))
  }

  widthMarkers.A1 = handleMarker(widthHandler('A1'))(geometry.A1).addTo(markerGroup)
  widthMarkers.A2 = handleMarker(widthHandler('A2'))(geometry.A2).addTo(markerGroup)
  disposables.addDisposable(() => widthMarkers.A1)
  disposables.addDisposable(() => widthMarkers.A2)

  return {
    geometries,
    update: () => updateShape(geometry),
    dispose: disposables.dispose,
    disposed: disposables.disposed
  }
}

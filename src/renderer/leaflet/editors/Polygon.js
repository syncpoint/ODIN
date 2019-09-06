import { Readable } from 'stream'
import L from 'leaflet'
import { K } from '../../../shared/combinators'
import disposable from '../../../shared/disposable'
import { circularDoublyLinkedList } from '../../../shared/lists'
import { handleMarker, midpointMarker } from './Markers'

export const polygonEditor = shape => (map, geometry) => {
  const disposables = disposable.of()
  const geometries = new Readable({ objectMode: true, read: () => {} })
  const markerGroup = K(new L.LayerGroup())(layer => map.addLayer(layer))
  disposables.addDisposable(() => map.removeLayer(markerGroup))
  const renderer = map.getRenderer(markerGroup)

  const markers = circularDoublyLinkedList()
  const moveMarkers = () => markers.filter(marker => !marker.midpoint)
  const { dispose: disposeShape, update: updateShape } = shape(map, renderer, geometry)
  disposables.addDisposable(disposeShape)
  disposables.addDisposable(() => markers.forEach(marker => markerGroup.removeLayer(marker)))

  const dragHandler = () => {
    const latlngs = moveMarkers().map(marker => marker.getLatLng())

    geometry = geometry.update(latlngs)
    updateShape(geometry)
    geometries.push(geometry)

    // Update midpoint markers:
    moveMarkers().forEach(marker => {
      const latlng = L.LatLng.midpoint([marker.getLatLng(), marker.succ.succ.getLatLng()])
      if (!marker.succ.midpoint) return
      marker.succ.setLatLng(latlng)
    })
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

  moveMarkers().forEach(marker => {
    const latlng = L.LatLng.midpoint([marker.getLatLng(), marker.succ.getLatLng()])
    const midpoint = midpointMarker(addHandler)(latlng).addTo(markerGroup)
    markers.append(midpoint, marker)
  })

  return {
    geometries,
    update: () => updateShape(geometry),
    dispose: disposables.dispose,
    disposed: disposables.disposed
  }
}

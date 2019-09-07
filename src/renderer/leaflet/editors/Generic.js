import { Readable } from 'stream'
import L from 'leaflet'
import { K } from '../../../shared/combinators'
import disposable from '../../../shared/disposable'
import { handleMarker } from './Markers'

/**
 * Generic editor with optional auxiliary shape.
 */
export const editor = shape => (map, geometry) => {
  const disposables = disposable.of()

  // TODO: replace with callback
  const geometries = new Readable({ objectMode: true, read: () => {} })
  const markerGroup = K(new L.LayerGroup())(layer => map.addLayer(layer))
  disposables.addDisposable(() => map.removeLayer(markerGroup))
  const renderer = map.getRenderer(markerGroup)

  const markers = {}
  let currentGeometry = geometry

  const { dispose: disposeShape, update: updateShape } = shape(map, renderer, currentGeometry)
  disposables.addDisposable(disposeShape)

  const dragHandler = id => ({ latlng }) => {
    currentGeometry = currentGeometry.update(id, latlng)
    updateShape(currentGeometry)
    geometries.push(currentGeometry)
    currentGeometry.points((id, latlng) => markers[id].setLatLng(latlng))
  }

  geometry.points((id, latlng) => {
    markers[id] = handleMarker(dragHandler(id))(latlng).addTo(markerGroup)
    disposables.addDisposable(() => markerGroup.removeLayer(markers[id]))
  })

  return {
    geometries,
    update: () => updateShape(currentGeometry),
    dispose: disposables.dispose,
    disposed: disposables.disposed
  }
}

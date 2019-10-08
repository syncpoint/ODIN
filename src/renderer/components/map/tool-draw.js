import L from 'leaflet'
import evented from '../../evented'

/**
 * Draw tool.
 */
export default map => options => {
  const prompt = options.prompt || ''
  evented.emit('OSD_MESSAGE', { message: prompt })

  const layerGroup = new L.LayerGroup().addTo(map)
  const polyline = L.polyline([]).addTo(layerGroup)
  const hintline = L.polyline([]).addTo(layerGroup)
  const icon = L.divIcon({ className: 'marker-icon cursor-marker' })

  const done = () => {
    const latlngs = polyline.getLatLngs()

    switch (options.geometryType) {
      case 'line': if (latlngs.length < 2) return; break
      case 'polygon': if (latlngs.length < 3) return; break
    }

    options.done(latlngs)
    map.tools.dispose()
  }

  let px = 0
  let py = 0

  const append = event => {
    const latlng = event.latlng

    // Prevent adding duplicates or point close to last point.
    const sq = x => x * x
    const d = Math.sqrt(sq(px - event.layerPoint.x) + sq(py - event.layerPoint.y))
    if (d < 20) return
    px = event.layerPoint.x
    py = event.layerPoint.y
    polyline.addLatLng(latlng)

    const pointCount = polyline.getLatLngs().length
    switch (options.geometryType) {
      case 'line-2pt': (pointCount === 2 ? done : () => {})()
    }
  }

  const tracker = new L.Marker(map.getCenter(), { icon }).addTo(layerGroup)
  tracker.on('click', append)
  tracker.on('dblclick', done)

  const updateTracker = ({ latlng }) => {
    tracker.setLatLng(latlng)
    const latlngs = polyline.getLatLngs()
    if (latlngs.length > 0) {
      hintline.setLatLngs([latlngs[latlngs.length - 1], latlng])
    }
  }

  map.on('mousemove', updateTracker)

  const handle = event => {
    // TODO: handle keydown:delete to remove last point
    switch (event.type) {
      case 'keydown:escape': return map.tools.dispose()
      case 'keydown:return': return done()
      case 'mousemove': return updateTracker(event.latlng)
    }
  }

  const dispose = () => {
    map.off('mousemove', updateTracker)
    evented.emit('OSD_MESSAGE', { message: '' })
    map.removeLayer(layerGroup)
  }

  return { name: 'draw', handle, dispose }
}

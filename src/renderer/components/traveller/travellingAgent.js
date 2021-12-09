import evented from '../../evented'
import { fromLonLat, toLonLat } from 'ol/proj'

const travellingAgent = map => {
  console.log('registering travveling agent ...')
  evented.on('TRAVEL', target => {
    if (!target) return

    const view = map.getView()
    const currentCenter = toLonLat(view.getCenter())
    process.nextTick(() => evented.emit('LEAVING', { lon: currentCenter[0], lat: currentCenter[1] }))

    const zoom = view.getZoom()
    view.animate(
      { zoom: zoom - 1 },
      { center: fromLonLat([target.lon, target.lat]) },
      { zoom: zoom }
    )
  })
}

export default travellingAgent

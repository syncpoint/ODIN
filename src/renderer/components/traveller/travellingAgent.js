import evented from '../../evented'
import { fromLonLat } from 'ol/proj'

const travellingAgent = map => {
  evented.on('TRAVEL', target => {
    if (!target) return

    const view = map.getView()
    const zoom = view.getZoom()
    view.animate(
      { zoom: zoom - 1 },
      { center: fromLonLat([target.lon, target.lat]) },
      { zoom: zoom }
    )
  })
}

export default travellingAgent

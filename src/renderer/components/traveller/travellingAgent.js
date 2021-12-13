import evented from '../../evented'
import { fromLonLat, toLonLat } from 'ol/proj'

const travellingAgent = map => {

  /* initialize first state with current center */
  if (window.history.length === 1) {
    const view = map.getView()
    const center = toLonLat(view.getCenter())
    const currentLocation = {
      lon: center[0], lat: center[1]
    }
    window.history.replaceState(currentLocation, '')
  }

  const setViewPort = target => {
    const view = map.getView()
    const zoom = view.getZoom()
    view.animate(
      { zoom: zoom - 1 },
      { center: fromLonLat([target.lon, target.lat]) },
      { zoom: zoom }
    )
  }

  // when history state changes
  const historyHandler = ({ state: location }) => {
    if (!location) return
    setViewPort(location)
  }
  window.addEventListener('popstate', historyHandler)

  evented.on('TRAVEL', target => {
    if (!target) return
    window.history.pushState(target, '')
    setViewPort(target)
  })

  evented.on('TRAVEL_BACK', () => {
    window.history.back()
  })

  evented.on('TRAVEL_FORWARD', () => {
    window.history.forward()
  })
}

export default travellingAgent

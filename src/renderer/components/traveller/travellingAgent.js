import evented from '../../evented'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { RegularShape, Stroke, Style } from 'ol/style'
import { Select } from 'ol/interaction'
import { registerHandler } from '../../clipboard'

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

  // we place a marker on the exact position
  const markers = new Collection()
  const selectedMarkers = new Collection()
  const selectInteraction = new Select(
    {
      features: selectedMarkers,
      style: new Style({
        image: new RegularShape({
          stroke: new Stroke({ color: 'red', width: 4 }),
          points: 4,
          radius: 13,
          radius2: 0,
          angle: 0
        })
      }),
      hitTolerance: 3
    }
  )

  const source = new VectorSource({ features: markers })
  const vector = new VectorLayer({
    source: source,
    style: new Style({
      image: new RegularShape({
        stroke: new Stroke({ color: 'black', width: 4 }),
        points: 4,
        radius: 13,
        radius2: 0,
        angle: 0
      })
    })
  })

  map.addLayer(vector)
  map.addInteraction(selectInteraction)

  // the only (inter)action after being selected is "delete"
  registerHandler('travel:', {
    copy: () => {},
    paste: () => {},
    cut: () => {},
    delete: () => {
      selectedMarkers.getArray().forEach(feature => source.removeFeature(feature))
      selectedMarkers.clear()
    },
    copyCoordinates: () => {}
  })

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

  // listening for events emitted by the UI
  evented.on('TRAVEL', target => {
    if (!target) return
    window.history.pushState(target, '')

    const marker = new Feature(new Point(fromLonLat([target.lon, target.lat])))
    markers.push(marker)

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

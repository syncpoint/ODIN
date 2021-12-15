import evented from '../../evented'
import uuid from 'uuid-random'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Select } from 'ol/interaction'
import { registerHandler } from '../../clipboard'
import selection from '../../selection'
import crosshairStyle from './crosshairStyle'

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
      style: crosshairStyle(true), // selected style
      hitTolerance: 3,
      filter: feature => feature.getId().startsWith('travel:')
    }
  )
  // when a coordinate-marker is selected we deselect all other features
  selectInteraction.on('select', ({ selected }) => {
    if (selected.length > 0) {
      selection.deselect()
    }
  })

  const source = new VectorSource({ features: markers })
  const vector = new VectorLayer({
    source: source,
    style: crosshairStyle()
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
    copyCoordinates: () => {
      console.log('running copyCoordinates ...')
      console.dir(selectedMarkers)
      if (selectedMarkers.getLength() !== 1) return ''
      const marker = selectedMarkers.getArray()[0]
      console.dir(marker)
      return toLonLat(marker.getGeometry().getCoordinates())
    }
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
    marker.setId(`travel:${uuid()}`)
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

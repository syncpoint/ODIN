import evented from '../../evented'
import uuid from 'uuid-random'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Select } from 'ol/interaction'
import { registerHandler } from '../../clipboard'
import selection from '../../selection'
import crosshairStyle from './crosshairStyle'

const TRAVEL_PREFIX = 'travel:'

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

  const selectInteraction = new Select(
    {
      style: crosshairStyle(true), // selected style
      hitTolerance: 4,
      filter: feature => feature.getId().startsWith(TRAVEL_PREFIX)
    }
  )
  // when a coordinate-marker is selected we deselect all other features
  selectInteraction.on('select', ({ selected, deselected }) => {
    if (selected.length > 0) {
      selection.deselect()
      selection.select(selected.map(marker => marker.getId()))
    } else if (deselected.length > 0) {
      selection.deselect(deselected.map(marker => marker.getId()))
    }
  })

  const vector = new VectorLayer({
    source: new VectorSource(),
    style: crosshairStyle()
  })

  map.addLayer(vector)
  map.addInteraction(selectInteraction)

  // the only (inter)actions after being selected are "delete" and "copyCoordinates"
  registerHandler(TRAVEL_PREFIX, {
    delete: () => {
      const source = vector.getSource()
      selection.selected()
        .filter(featureId => featureId.startsWith(TRAVEL_PREFIX))
        .map(featureId => source.getFeatureById(featureId))
        .forEach(feature => {
          source.removeFeature(feature)
        })
    },
    copyCoordinates: () => {
      const selected = selection.selected()
      if (selected.length !== 1) return ''

      const source = vector.getSource()
      const marker = selected
        .filter(featureId => featureId.startsWith(TRAVEL_PREFIX))
        .map(featureId => source.getFeatureById(featureId))
      console.dir(marker)
      return marker[0] ? toLonLat(marker[0].getGeometry().getCoordinates()) : ''
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
    marker.setId(`${TRAVEL_PREFIX}${uuid()}`)
    vector.getSource().addFeature(marker)

    setViewPort(target)
  })

  evented.on('TRAVEL_BACK', () => {
    window.history.back()
  })

  evented.on('TRAVEL_FORWARD', () => {
    window.history.forward()
  })

  selection.on('selected', ids => {
    // if any feature that is not a TRAVEL marker is selected
    // we remove our own selection
    if (ids.filter(id => !(id.startsWith(TRAVEL_PREFIX))).length > 0) {
      const deselectables = selection.selected().filter(id => id.startsWith(TRAVEL_PREFIX))
      selection.deselect(deselectables)
      selectInteraction.getFeatures().clear()
    }
  })

}

export default travellingAgent

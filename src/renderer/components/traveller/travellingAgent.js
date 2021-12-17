import evented from '../../evented'
import uuid from 'uuid-random'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Select } from 'ol/interaction'
import { registerHandler } from '../../clipboard'
import selection from '../../selection'
import crosshairStyle from './crosshairStyle'
import URI from '../../project/URI'


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

  /* we need a vector layer for our markers */
  const vector = new VectorLayer({
    source: new VectorSource({ features: new Collection() }),
    style: crosshairStyle()
  })

  /* the only way to interact with the markers is to select (and delete) them */
  const selectInteraction = new Select(
    {
      style: crosshairStyle(true), // selected style
      hitTolerance: 5,
      filter: feature => URI.isTravelMarkerId(feature.getId())
    }
  )
  /*
    We need to play nicely with features other parts of the application.
    When a coordinate-marker is _selected_ we deselect all other features first.
    Then we _deselect_ markers we just remove them from the app-wide selection list
  */
  selectInteraction.on('select', ({ selected: selectedMarkers, deselected: deselectedMarkers }) => {
    if (selectedMarkers.length > 0) {
      selection.deselect()
      selection.select(selectedMarkers.map(marker => marker.getId()))
    } else if (deselectedMarkers.length > 0) {
      selection.deselect(deselectedMarkers.map(marker => marker.getId()))
    }
  })

  selection.on('selected', ids => {
    /*
      If any feature that is not a TRAVEL marker is selected
      we remove our markes from the list of selected features
      and clear the internal collection of the select interaction
    */
    const nonTravelMarkers = ids.filter(id => !(URI.isTravelMarkerId(id)))

    if (nonTravelMarkers.length > 0) {
      selection.deselect(ids.filter(URI.isTravelMarkerId))
      selectInteraction.getFeatures().clear()
    }
  })

  map.addLayer(vector)
  map.addInteraction(selectInteraction)

  // the only (inter)actions after being selected are "delete" and "copyCoordinates"
  registerHandler(URI.SCHEME_TRAVEL_MARKER, {
    delete: () => {
      const source = vector.getSource()
      selection.selected()
        .filter(URI.isTravelMarkerId)
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
        .filter(URI.isTravelMarkerId)
        .map(featureId => source.getFeatureById(featureId))
      return marker[0] ? toLonLat(marker[0].getGeometry().getCoordinates()) : ''
    }
  })

  /*****************************************************************************/

  const setViewPort = target => {
    const view = map.getView()
    const zoom = view.getZoom()
    view.animate(
      { zoom: zoom - 1 },
      { center: fromLonLat([target.lon, target.lat]) },
      { zoom: zoom }
    )
  }

  /*
    Navigating between locations works by making use of the browser's history
    collection. Every time we travel to a _new_ location we push the state = location
    to the history stack and create a new "travel marker" on the map. When the user
    navigates between _known_ location the browser emits a "popstate" event with
    the state = location as a parameter.
  */
  const historyHandler = ({ state: location }) => {
    if (!location) return
    setViewPort(location)
  }
  window.addEventListener('popstate', historyHandler)

  /*
    The Traveller UI emits events to go to
      + a new location
      + forward on the history stack
      + backwards on the history stack
  */
  evented.on('TRAVEL', target => {
    if (!target) return
    window.history.pushState(target, '')

    const marker = new Feature(new Point(fromLonLat([target.lon, target.lat])))
    marker.setId(`${URI.SCHEME_TRAVEL_MARKER}${uuid()}`)
    vector.getSource().addFeature(marker)

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

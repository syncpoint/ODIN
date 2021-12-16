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
      hitTolerance: 4,
      filter: feature => URI.isTravelMarkerId(feature.getId())
    }
  )
  /*
    We need to play nicely with features other parts of the application.
    When a coordinate-marker is __selected__ we deselect all other features first.
    Then we __deselect__ markers we just remove them from the app-wide selection list
  */
  selectInteraction.on('select', ({ selected, deselected }) => {
    if (selected.length > 0) {
      selection.deselect()
      selection.select(selected.map(marker => marker.getId()))
    } else if (deselected.length > 0) {
      selection.deselect(deselected.map(marker => marker.getId()))
    }
  })

  selection.on('selected', ids => {
    /*
      If any feature that is not a TRAVEL marker is selected
      we remove our markes from the list of selected features
      and clear the internal collection of the select interaction
    */
    if (ids.filter(id => !(URI.isTravelMarkerId(id))).length > 0) {
      const deselectables = selection.selected().filter(URI.isTravelMarkerId)
      selection.deselect(deselectables)
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
      console.log('## copyCoordinates MAP', marker[0]?.getGeometry().getCoordinates())
      const ll = marker[0] ? toLonLat(marker[0].getGeometry().getCoordinates()) : ''
      console.log('## copyCoordinates', ll)
      return ll
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

  // when history state changes
  const historyHandler = ({ state: location }) => {
    if (!location) return
    setViewPort(location)
  }
  window.addEventListener('popstate', historyHandler)

  // listening for events emitted by the UI
  evented.on('TRAVEL', target => {
    console.dir(target)
    if (!target) return
    window.history.pushState(target, '')

    const coordinates = fromLonLat([target.lon, target.lat])
    console.log('## new marker at', target)
    console.log('## new marker at', coordinates)
    const marker = new Feature(new Point(coordinates))
    marker.setId(`${URI.SCHEME_TRAVEL_MARKER}${uuid()}`)
    const source = vector.getSource()
    source.addFeature(marker)

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

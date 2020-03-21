import React from 'react'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import evented from '../evented'
import 'ol/ol.css'
import * as ol from 'ol'
import { fromLonLat, toLonLat } from 'ol/proj'
import { ScaleLine } from 'ol/control'
import { feature as featureSource } from './source/feature'
import { feature as featureLayer } from './layer/feature'
import { tile as tileLayer } from './layer/tile'
import project from '../project'
import coordinateFormat from '../../shared/coord-format'
import './style/scalebar.css'

const zoom = view => view.getZoom()
const center = view => toLonLat(view.getCenter())

const viewportChanged = view => () => {
  const viewport = { zoom: zoom(view), center: center(view) }
  ipcRenderer.send('IPC_VIEWPORT_CHANGED', viewport)
  project.updatePreferences({ viewport })
}


/** Handle project open/close. */
const projectEventHandler = (view, map) => event => {
  const handlers = {
    open: () => {
      // Set feature vector layers.
      project.layers()
        .map(filename => featureSource(filename))
        .map(source => featureLayer(source))
        .forEach(layer => map.addLayer(layer))

      // Set center/zoom.
      const { center, zoom } = project.preferences().viewport
      view.setCenter(fromLonLat(center))
      view.setZoom(zoom)
    },

    close: () => {
      // Clear feature layers.
      map.getLayers().clear()
      map.addLayer(tileLayer())
    }
  }

  ;(handlers[event] || (() => {}))()
}


/**
 * Setup map instance (aka `componentDidMount`).
 *
 * effect :: ({k: v}, [Map -> Unit]) -> () -> Undefined
 */
const effect = props => () => {
  const { id } = props
  const { center, zoom } = { center: [16.363449, 48.210033], zoom: 8 }
  const view = new ol.View({ center: fromLonLat(center), zoom })

  const scaleLine = new ScaleLine({
    units: 'metric',
    bar: true,
    steps: 4,
    text: true,
    minWidth: 140
  })

  const map = new ol.Map({
    view,
    layers: [tileLayer()],
    target: id,
    controls: [scaleLine]
  })

  map.on('moveend', viewportChanged(view))
  map.on('pointermove', event => {
    const lonLatCooridinate = toLonLat(event.coordinate)
    const currentCoordinate = coordinateFormat.format({ lng: lonLatCooridinate[0], lat: lonLatCooridinate[1] })
    // TODO: throttle?
    evented.emit('OSD_MESSAGE', { message: currentCoordinate, slot: 'C2' })
  })

  project.register(projectEventHandler(view, map))
}

/**
 * React OpenLayers Map function component.
 */
const Map = props => {
  // Only used once:
  React.useEffect(effect(props), [])
  return <div id={props.id} />
}

Map.propTypes = {
  id: PropTypes.string.isRequired
}

export default Map

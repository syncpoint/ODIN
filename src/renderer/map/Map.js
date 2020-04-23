import React from 'react'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'

import * as ol from 'ol'
import 'ol/ol.css'
import { fromLonLat, toLonLat } from 'ol/proj'
import { ScaleLine } from 'ol/control'


import evented from '../evented'
import project from '../project'
import coordinateFormat from '../../shared/coord-format'
import layers from './layers'
import basemap from './basemap'
import './style/scalebar.css'
import undo from '../undo'
import disposable from '../../shared/disposable'

const zoom = view => view.getZoom()
const center = view => toLonLat(view.getCenter())

const viewportChanged = view => () => {
  const viewport = { zoom: zoom(view), center: center(view) }
  ipcRenderer.send('IPC_VIEWPORT_CHANGED', viewport)
  project.updatePreferences({ viewport })
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

  /*
    Handling the basemap layer is done using the basemap module.
  */
  basemap(map)


  // Provide layer/interaction cleanup.
  let disposables = disposable.of()

  const addLayer = layer => {
    map.addLayer(layer)
    disposables.addDisposable(() => map.removeLayer(layer))
  }

  const addInteraction = interaction => {
    map.addInteraction(interaction)
    disposables.addDisposable(() => map.removeInteraction(interaction))
  }

  const dispose = () => {
    disposables.dispose()
    disposables = disposable.of()
  }

  // Delegate layer management.
  // Note: We don't directly expose complete Map API,
  // but only essential operations.
  layers({
    addLayer,
    addInteraction,
    dispose,
    setCenter: view.setCenter.bind(view),
    setZoom: view.setZoom.bind(view),
    rotation: view.getRotation.bind(view)
  })
}

const onFocus = () => {
  ipcRenderer.on('IPC_EDIT_UNDO', undo.undo)
  ipcRenderer.on('IPC_EDIT_REDO', undo.redo)
}

const onBlur = () => {
  ipcRenderer.off('IPC_EDIT_UNDO', undo.undo)
  ipcRenderer.off('IPC_EDIT_REDO', undo.redo)
}

/**
 * React OpenLayers Map function component.
 */
const Map = props => {
  // Only used once:
  React.useEffect(effect(props), [])
  return <div
    id={props.id}
    tabIndex="0"
    onFocus={ onFocus }
    onBlur={ onBlur }
  />
}

Map.propTypes = {
  id: PropTypes.string.isRequired
}

export default Map

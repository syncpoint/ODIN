import React from 'react'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'

import * as ol from 'ol'
import 'ol/ol.css'
import { fromLonLat, toLonLat } from 'ol/proj'
import { ScaleLine } from 'ol/control'
import { defaults as defaultInteractions } from 'ol/interaction'
import getGridLayerGroup from './grids/group'
import basemapLayerGroup from './basemap/group'

import evented from '../evented'
import preferences from '../project/preferences'
import coordinateFormat from '../../shared/coord-format'
import layers from './layers'
import draw from './draw'
import share from './share'
import './style/scalebar.css'

const zoom = view => view.getZoom()
const center = view => toLonLat(view.getCenter())

const viewportChanged = view => () => {
  const viewport = { zoom: zoom(view), center: center(view) }
  ipcRenderer.send('IPC_VIEWPORT_CHANGED', viewport)
  preferences.set('viewport', viewport)
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
    controls: [scaleLine],
    layers: [basemapLayerGroup(), getGridLayerGroup()],
    interactions: defaultInteractions({
      doubleClickZoom: false
    })
  })

  map.on('click', () => evented.emit('MAP_CLICKED'))
  map.on('moveend', viewportChanged(view))
  map.on('pointermove', event => {
    const lonLatCooridinate = toLonLat(event.coordinate)
    const currentCoordinate = coordinateFormat.format({ lng: lonLatCooridinate[0], lat: lonLatCooridinate[1] })

    // TODO: throttle?
    evented.emit('OSD_MESSAGE', { message: currentCoordinate, slot: 'C2' })
  })

  layers(map)
  draw(map)
  share(map)

  // Set viewport and basemap from preferences.
  preferences.register(({ type, preferences }) => {
    if (type !== 'preferences') return
    const { center, zoom } = preferences.viewport
    view.setCenter(fromLonLat(center))
    view.setZoom(zoom)
  })
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
  />
}

Map.propTypes = {
  id: PropTypes.string.isRequired
}

export default Map

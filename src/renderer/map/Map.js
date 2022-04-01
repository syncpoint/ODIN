import React from 'react'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import throttle from 'lodash.throttle'

import * as ol from 'ol'
import 'ol/ol.css'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Attribution, ScaleLine } from 'ol/control'
import { defaults as defaultInteractions } from 'ol/interaction'
import { Vector as VectorLayer } from 'ol/layer'
import getGridLayerGroup from './grids/group'
import basemapLayerGroup from './basemap/group'

import evented from '../evented'
import preferences from '../project/preferences'
import coordinateFormat from '../../shared/coord-format'
import layers from './layers'
import draw from './interaction/draw'
import measure from './interaction/measure/'
import dropImport from './interaction/drop-import'
import share from './share'
import print from './print/print'
import travel from '../components/traveller/travellingAgent'

import './style/scalebar.css'

const zoom = view => view.getZoom()
const center = view => toLonLat(view.getCenter())

const viewportChanged = view => () => {
  const viewport = { zoom: zoom(view), center: center(view) }
  ipcRenderer.send('IPC_VIEWPORT_CHANGED', viewport)
  preferences.set('viewport', viewport)
}

const updateCoordinateDisplay = ({ coordinate }) => {
  const lonLatCooridinate = toLonLat(coordinate)
  const currentCoordinate = coordinateFormat.format({ lng: lonLatCooridinate[0], lat: lonLatCooridinate[1] })
  evented.emit('OSD_MESSAGE', { message: currentCoordinate, slot: 'C2' })
  evented.emit('MOUSE_COORDINATES_UPDATE', { coordinates: lonLatCooridinate })
}


/**
 * Setup map instance (aka `componentDidMount`).
 *
 * effect :: ({k: v}, [Map -> Unit]) -> () -> Undefined
 */
const effect = props => () => {
  const { id } = props
  const { center, zoom } = { center: [16.363449, 48.210033], zoom: 8 }
  const view = new ol.View({ center: fromLonLat(center), zoom, enableRotation: false })

  const scaleLine = new ScaleLine({
    units: 'metric',
    bar: true,
    steps: 4,
    text: true,
    minWidth: 140
  })

  const attribution = new Attribution({
    collapsible: true
  })

  const map = new ol.Map({
    view,
    target: id,
    controls: [scaleLine, attribution],
    layers: [basemapLayerGroup(), getGridLayerGroup()],
    interactions: defaultInteractions({
      doubleClickZoom: false
    }).extend([dropImport])
  })

  map.on('click', () => evented.emit('MAP_CLICKED'))
  map.on('moveend', viewportChanged(view))
  map.on('pointermove', throttle(updateCoordinateDisplay, 75))

  layers(map)
  draw(map)
  measure(map)
  share(map)
  print(map)
  travel(map)

  // restore viewport and active layer name from preferences.
  preferences.register(event => {
    const { type, preferences, key } = event
    const triggerKeys = ['labels', 'lineWidth', 'symbolSize', 'scheme', 'simpleStatusModifier', 'symbolSizeByEchelon', 'symbolTextSize', 'labelTextSize', 'useBoldLabelText']
    if (type === 'preferences') {
      const { activeLayer } = preferences
      if (activeLayer) evented.emit('OSD_MESSAGE', { message: activeLayer, slot: 'A2' })

      const { center, zoom } = preferences.viewport
      view.setCenter(fromLonLat(center))
      view.setZoom(zoom)
    } else if (triggerKeys.includes(key)) {
      map.getLayers().forEach(layer => {
        if (layer instanceof VectorLayer) layer.changed()
      })
    }

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

import React from 'react'
import PropTypes from 'prop-types'
import { ipcRenderer, remote } from 'electron'
import evented from '../evented'
import fs from 'fs'
import path from 'path'
import 'ol/ol.css'
import * as ol from 'ol'
import { fromLonLat, toLonLat } from 'ol/proj'
import { feature as featureSource } from './source/feature'
import { feature as featureLayer } from './layer/feature'
import { tile as tileLayer } from './layer/tile'
import coordinateFormat from '../../shared/coord-format'

const zoom = view => view.getZoom()
const center = view => toLonLat(view.getCenter())

const viewportChanged = view => () => {
  const viewport = { zoom: zoom(view), center: center(view) }
  ipcRenderer.send('IPC_VIEWPORT_CHANGED', viewport)
}


/**
 * Load all GeoJSON layers from project's overlays directory.
 * @param {string} project parent directory of 'overlays'
 */
const projectOverlays = async project => {
  if (!project) return []

  const dir = path.join(project, 'overlays')
  const filenames = await fs.promises.readdir(dir)
  return filenames
    .filter(filename => filename.endsWith('.json'))
    .map(filename => path.join(dir, filename))
    .map(filename => featureSource(filename))
    .map(source => featureLayer(source))
}


/**
 * Setup map instance (aka `componentDidMount`).
 *
 * effect :: ({k: v}, [Map -> Unit]) -> () -> Undefined
 */
const effect = props => () => {
  const { id } = props
  const vienna = [16.363449, 48.210033]
  const { viewport = {}, path: project } = remote.getCurrentWindow()
  const { center = vienna, zoom = 8 } = viewport
  const view = new ol.View({ center: fromLonLat(center), zoom })

  const map = new ol.Map({
    view,
    layers: [tileLayer()],
    target: id,
    controls: []
  })

  projectOverlays(project).then(layers => layers.forEach(layer => map.addLayer(layer)))

  map.on('moveend', viewportChanged(view))
  map.on('pointermove', pointerMovedEvent => {
    const lonLatCooridinate = toLonLat(pointerMovedEvent.coordinate)
    const currentCoordinate = coordinateFormat.format({ lng: lonLatCooridinate[0], lat: lonLatCooridinate[1] })
    evented.emit('OSD_MESSAGE', { message: currentCoordinate, slot: 'C2' })
  })

  ipcRenderer.on('IPC_OPEN_PROJECT', (_, [project]) => {
    map.getLayers().clear()
    map.addLayer(tileLayer())
    projectOverlays(project).then(layers => layers.forEach(layer => map.addLayer(layer)))
    evented.emit('OSD_MESSAGE', { message: path.basename(project), slot: 'A1' })
  })
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

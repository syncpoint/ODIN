import React from 'react'
import PropTypes from 'prop-types'
import { ipcRenderer, remote } from 'electron'
import 'ol/ol.css'
import * as ol from 'ol'
import { fromLonLat, toLonLat } from 'ol/proj'
import { feature as featureSource } from './source/feature'
import { feature as featureLayer } from './layer/feature'
import { tile as tileLayer } from './layer/tile'

const zoom = view => view.getZoom()
const center = view => toLonLat(view.getCenter())
const viewport = view => ({ zoom: zoom(view), center: center(view) })

const viewportChanged = viewport => {
  console.log('viewport', viewport)
  ipcRenderer.send('IPC_VIEWPORT_CHANGED', viewport)
}

/**
 * Setup map instance (aka `componentDidMount`).
 *
 * effect :: ({k: v}, [Map -> Unit]) -> () -> Undefined
 */
const effect = props => () => {
  const { id } = props
  const vienna = [16.363449, 48.210033]
  const { center = vienna, zoom = 8 } = remote.getCurrentWindow().viewport || {}
  const view = new ol.View({ center: fromLonLat(center), zoom })

  const layers = [
    tileLayer(),
    // TODO: create feature layers from project file(s)
    featureLayer(featureSource())
  ]

  const map = new ol.Map({
    view,
    layers,
    target: id,
    controls: []
  })

  map.on('moveend', () => viewportChanged(viewport(view)))
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

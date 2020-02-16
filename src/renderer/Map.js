import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import 'ol/ol.css'
import * as ol from 'ol'
import { toLonLat, fromLonLat } from 'ol/proj'

import evented from './evented'
import style from './style'
import { tileLayer } from './map/map-tiles'
import { featureLayer, selectionLayer } from './map/map-vector'
import { interactions } from './map/map-interaction'

const tail = ([_, ...values]) => values
const zoom = view => view.getZoom()
const center = view => toLonLat(view.getCenter())
const viewport = view => ({ zoom: zoom(view), center: center(view) })


/**
 * Setup map instance (aka `componentDidMount`).
 *
 * effect :: ({k: v}, [Map -> Unit]) -> () -> Undefined
 */
const effect = (props, [setMap]) => () => {
  const { id, viewportChanged } = props
  const { zoom, center } = props.viewport
  const view = new ol.View({ zoom, center: fromLonLat(center) })
  const layers = [tileLayer(), featureLayer, selectionLayer]
  const map = new ol.Map({ view, layers, target: id, controls: [] })

  // don't replace default interactions
  interactions(map)({ featureLayer, selectionLayer, style })
  map.on('moveend', () => viewportChanged(viewport(view)))

  evented.emit('map.ready')
  setMap(map)
}


/**
 * React OpenLayers Map function component.
 */
const Map = props => {
  // Only used once:
  useEffect(effect(props, tail(useState(null))), [])
  return <div id={props.id} />
}

Map.propTypes = {
  viewport: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  viewportChanged: PropTypes.func.isRequired
}

export default Map

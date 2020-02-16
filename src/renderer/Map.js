import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import 'ol/ol.css'
import * as ol from 'ol'
import { Vector as FeatureLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { GeoJSON } from 'ol/format'
import { toLonLat, fromLonLat } from 'ol/proj'
import { bbox } from 'ol/loadingstrategy'

import loaders from './loaders'
import evented from './evented'
import style from './style'
import { tileLayer } from './map-tiles'
import { interactions } from './map-interaction'

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
  const url = 'http://localhost:32768/styles/osm-bright/{z}/{x}/{y}{ratio}.png'
  const { zoom, center } = props.viewport
  const view = new ol.View({ zoom, center: fromLonLat(center) })

  const featureSource = new VectorSource({
    format: new GeoJSON({ dataProjection: 'EPSG:3857' }),
    // Strategy function for loading features based on the view's extent and resolution.
    strategy: bbox,
    loader: loaders.mipdb
  })

  const featureLayer = new FeatureLayer({ style, source: featureSource })
  const selectionLayer = new FeatureLayer({ style, source: new VectorSource() })
  const layers = [tileLayer(url), featureLayer, selectionLayer]
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

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import 'ol/ol.css'
import * as ol from 'ol'
import { Vector as FeatureLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { GeoJSON } from 'ol/format'
import { toLonLat, fromLonLat } from 'ol/proj'
import { Style } from 'ol/style'
import { bbox } from 'ol/loadingstrategy'

import loaders from './loaders'
import evented from './evented'
import style from './style'
import preferences from './preferences'

import { tileLayer } from './map-tiles'
import { interactions } from './map-interaction'

const tail = ([_, ...values]) => values
const zoom = view => view.getZoom()
const center = view => toLonLat(view.getCenter())
const viewport = view => ({ zoom: zoom(view), center: center(view) })
const sidc = feature => feature.getProperties().sidc


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
    format: new GeoJSON({
      dataProjection: 'EPSG:3857'
    }),
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

  const featuresPrefs = preferences.features()

  const applyStyle = style => predicate => featureSource.getFeatures()
    .filter(predicate)
    .forEach(feature => feature.setStyle(style))

  // Clear cached feature styles, so they are refreshed in next cycle.
  const clearStylesAndRefresh = () => {
    applyStyle(null)(_ => true)
    featureSource.changed()
  }

  // TODO: limit refresh to point geometries.
  featuresPrefs.observe(clearStylesAndRefresh)('symbol-scale')
  featuresPrefs.observe(clearStylesAndRefresh)('labels')

  const visibilityOberservers = {
    all: _ => true,
    units: f => sidc(f).match(/S.G.U/),
    graphics: f => f.getGeometry().getType() !== 'Point',
    points: f => f.getGeometry().getType() === 'Point'
  }

  Object.entries(visibilityOberservers).forEach(([what, predicate]) => {
    featuresPrefs.observe(flag => {
      applyStyle(flag ? null : new Style())(predicate)
      featureSource.changed()
    })(what)
  })

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

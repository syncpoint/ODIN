import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import 'ol/ol.css'
import * as ol from 'ol'
import { GeoJSON } from 'ol/format'
import { fromLonLat } from 'ol/proj'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import layer from './layer.json'
import style from './style'
const tail = ([_, ...values]) => values


/**
 * Setup map instance (aka `componentDidMount`).
 *
 * effect :: ({k: v}, [Map -> Unit]) -> () -> Undefined
 */
const effect = (props, [setMap]) => () => {
  const { id } = props

  const view = new ol.View({
    center: fromLonLat([25.353574, 59.036962]),
    zoom: 9
  })

  const source = new VectorSource({
    /**
     * NOTE: function is bound to underlying VectorSource.
     */
    loader: function (extent, resolution, projection) {
      const format = this.getFormat()
      const features = format.readFeatures(layer)
      this.addFeatures(features)
    },
    format: new GeoJSON({ dataProjection: 'EPSG:3857' })
  })


  const featureLayer = new VectorLayer({
    style,
    source
  })

  const layers = [
    new TileLayer({ source: new OSM() }),
    featureLayer
  ]

  const map = new ol.Map({
    view,
    layers,
    target: id,
    controls: []
  })

  console.log(map)

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
  id: PropTypes.string.isRequired
}

export default Map

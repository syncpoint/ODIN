import React from 'react'
import PropTypes from 'prop-types'

import 'ol/ol.css'
import * as ol from 'ol'
import { fromLonLat } from 'ol/proj'
import { feature as featureSource } from './source/feature'
import { feature as featureLayer } from './layer/feature'
import { tile as tileLayer } from './layer/tile'


/**
 * Setup map instance (aka `componentDidMount`).
 *
 * effect :: ({k: v}, [Map -> Unit]) -> () -> Undefined
 */
const effect = props => () => {
  const { id } = props

  // TODO: grab center/zoom from project preferences
  const view = new ol.View({
    center: fromLonLat([25.353574, 59.036962]),
    zoom: 9
  })

  const layers = [
    tileLayer(),
    // TODO: create feature layers from project file(s)
    featureLayer(featureSource())
  ]

  /* eslint-disable no-new */
  new ol.Map({
    view,
    layers,
    target: id,
    controls: []
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

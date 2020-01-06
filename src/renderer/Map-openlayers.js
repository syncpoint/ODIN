/* eslint-disable */

import React, { useEffect, useState } from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import GeoJSON from 'ol/format/GeoJSON'
import { toLonLat, fromLonLat } from 'ol/proj'
import { defaults as defaultInteractions, Select, Translate, Modify } from 'ol/interaction'
import { click } from 'ol/events/condition'
import { withStyles } from '@material-ui/core/styles'
import evented from './evented'
import { propTypes, styles } from './Map'
import { defaultStyle, highlightStyle } from './styles'
import { CustomInteraction } from './CustomInteraction'
import Mousetrap from 'mousetrap'

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
  const options = ({ zoom, center }) => ({ zoom, center: fromLonLat(center) })
  const view = new ol.View(options(props.viewport))
  const layers = [new TileLayer({ source: new OSM() })]

  const hitTolerance = 4

  // const select = new Select({ condition: click, style: highlightStyle, hitTolerance })
  // const translate = new Translate({ features: select.getFeatures(), hitTolerance })
  // const modify = new Modify({ features: select.getFeatures(), hitTolerance })
  // const interactions = defaultInteractions().extend([modify, translate, select])

  const select = new CustomInteraction({ hitTolerance })
  const modify = new Modify({ features: select.getFeatures(), hitTolerance })
  const interactions = defaultInteractions().extend([select, modify])


  const map = new ol.Map({ view, layers, interactions, target: id })
  map.on('moveend', () => viewportChanged(viewport(view)))

  evented.on('layer.geojson', json => {
    // Data projection defaults to 'EPSG:4326'.
    const features = new GeoJSON().readFeatures(json, { featureProjection: 'EPSG:3857' })
    const source = new VectorSource({ features })
    const removeFeature = feature => source.removeFeature(feature)
    // FIXME: style must be associated directly with feature
    const layer = new VectorLayer({ source, style: defaultStyle })
    map.addLayer(layer)

    Mousetrap.bind('mod+backspace', () => {
      select.getFeatures().forEach(removeFeature)
      select.clearSelection()
    })
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
  return <div id={props.id} className={props.classes.root} />
}

Map.propTypes = propTypes
export default withStyles(styles)(Map)

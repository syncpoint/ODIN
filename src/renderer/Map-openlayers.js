import React, { useEffect, useState } from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import GeoJSON from 'ol/format/GeoJSON'
import { transform } from 'ol/proj'
import { defaults as defaultInteractions, Select, Translate } from 'ol/interaction'
import { click } from 'ol/events/condition'
import { withStyles } from '@material-ui/core/styles'
import evented from './evented'
import { propTypes, styles } from './Map'
import { defaultStyle, highlightStyle } from './styles'

const tail = ([_, ...values]) => values
const fromWGS84 = lnglat => transform(lnglat, 'EPSG:4326', 'EPSG:3857')
const toWGS84 = coord => transform(coord, 'EPSG:3857', 'EPSG:4326')

const zoom = view => view.getZoom()
const center = view => toWGS84(view.getCenter())
const viewport = view => ({ zoom: zoom(view), center: center(view) })


/**
 * Setup map instance (aka `componentDidMount`).
 *
 * effect :: ({k: v}, [Map -> Unit]) -> () -> Undefined
 */
const effect = (props, [setMap]) => () => {
  const { id, viewportChanged } = props
  const options = ({ zoom, center }) => ({ zoom, center: fromWGS84(center) })
  const view = new ol.View(options(props.viewport))
  const layers = [new TileLayer({ source: new OSM() })]

  const select = new Select({ condition: click, style: highlightStyle })
  const translate = new Translate({ features: select.getFeatures() })
  const interactions = defaultInteractions().extend([select, translate])
  const map = new ol.Map({ view, layers, interactions, target: id })
  map.on('moveend', () => viewportChanged(viewport(view)))

  evented.on('layer.geojson', json => {
    const features = new GeoJSON().readFeatures(json, { featureProjection: 'EPSG:3857' })
    const source = new VectorSource({ features })
    const layer = new VectorLayer({ source, style: defaultStyle })
    map.addLayer(layer)
  })

  evented.emit('map.ready')
  setMap(map)
}


/**
 * React OpenLayers Map function component.
 */
const Map = props => {
  useEffect(effect(props, tail(useState(null))), [])
  return <div id={props.id} className={props.classes.root} />
}

Map.propTypes = propTypes
export default withStyles(styles)(Map)

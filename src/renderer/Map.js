import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import 'ol/ol.css'
import * as ol from 'ol'
import { Tile as TileLayer } from 'ol/layer'
import { OSM } from 'ol/source'
import { toLonLat, fromLonLat } from 'ol/proj'
import { withStyles } from '@material-ui/core/styles'
import evented from './evented'

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
  const map = new ol.Map({ view, layers, target: id })

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
  return <div id={props.id} className={props.classes.root} />
}

Map.propTypes = {
  classes: PropTypes.any.isRequired,
  viewport: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  viewportChanged: PropTypes.func.isRequired
}

const styles = {
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10
  }
}

export default withStyles(styles)(Map)

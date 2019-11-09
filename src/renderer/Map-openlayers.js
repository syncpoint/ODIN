import React, { useEffect, useState } from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { transform } from 'ol/proj'
import { withStyles } from '@material-ui/core/styles'
import { propTypes, styles } from './Map'

const tail = ([_, ...values]) => values
const fromWGS84 = lnglat => transform(lnglat, 'EPSG:4326', 'EPSG:3857')
const toWGS84 = coord => transform(coord, 'EPSG:3857', 'EPSG:4326')

const zoom = view => view.getZoom()
const center = view => toWGS84(view.getCenter())
const viewport = view => ({ zoom: zoom(view), center: center(view) })

const Map = props => {
  const { id, viewportChanged, classes } = props
  const [setMap] = tail(useState(null))

  const effect = () => {
    const options = ({ zoom, center }) => ({ zoom, center: fromWGS84(center) })
    const view = new ol.View(options(props.viewport))
    const layers = [new TileLayer({ source: new OSM() })]
    const map = new ol.Map({ view, layers, target: id })
    map.on('moveend', () => viewportChanged(viewport(view)))
    setMap(map)
  }

  useEffect(effect, [])
  return <div id={id} className={classes.root} />
}

Map.propTypes = propTypes
export default withStyles(styles)(Map)

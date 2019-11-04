import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { transform } from 'ol/proj'
import { withStyles } from '@material-ui/core/styles'
import { propTypes, styles } from './Map'

const fromWGS84 = lnglat => transform(lnglat, 'EPSG:4326', 'EPSG:3857')
const toWGS84 = coord => transform(coord, 'EPSG:3857', 'EPSG:4326')

class Map extends React.Component {
  componentDidMount () {
    const { id, viewport, options } = this.props
    const { viewportChanged } = this.props
    const [lng, lat] = viewport.center
    const layers = [new TileLayer({ source: new OSM() })]

    const view = new ol.View({
      ...options,
      center: fromWGS84([lng, lat]),
      zoom: viewport.zoom
    })

    this.map = new ol.Map({
      layers,
      view,
      target: id,
      controls: []
    })

    this.map.on('moveend', () => {
      const zoom = view.getZoom()
      const center = toWGS84(view.getCenter())
      viewportChanged({ zoom, center })
    })
  }

  render () {
    const { classes, id } = this.props
    return <div id={id} className={classes.root} />
  }
}

Map.propTypes = propTypes
export default withStyles(styles)(Map)

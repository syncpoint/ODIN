import * as R from 'ramda'
import React from 'react'
import mapboxgl from 'mapbox-gl'
import { withStyles } from '@material-ui/core/styles'
import { propTypes, styles } from './Map'

const lnglat = ({ lng, lat }) => [lng, lat]
const zoom = map => map.getZoom()
const center = map => lnglat(map.getCenter())
const viewport = map => ({ zoom: zoom, center: center(map) })

class Map extends React.Component {
  componentDidMount () {
    const { id, viewportChanged } = this.props

    this.map = new mapboxgl.Map({
      container: id,
      style: 'http://localhost:8081/styles/osm-bright/style.json',
      ...this.props.viewport
    })

    const moveend = R.compose(viewportChanged, viewport)
    this.map.on('moveend', ({ target }) => moveend(target))
  }

  render () {
    const props = { id: this.props.id, className: this.props.classes.root }
    return <div {...props} />
  }
}

Map.propTypes = propTypes
export default withStyles(styles)(Map)

import React from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { withStyles } from '@material-ui/core/styles'
import { propTypes, styles } from './Map'
import { K } from '../shared/combinators'

class Map extends React.Component {
  componentDidMount () {
    const { id, viewport, viewportChanged } = this.props

    const mapOptions = {
      zoom: viewport.zoom,
      center: L.latLng(viewport.center.reverse())
    }

    this.map = K(L.map(id, mapOptions))(map => {
      const url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      const options = { maxZoom: 19 }
      new L.TileLayer(url, options).addTo(map)
      map._container.focus()
    })

    this.map.on('moveend', () => {
      const zoom = this.map.getZoom()
      const { lat, lng } = this.map.getCenter()
      viewportChanged({ zoom, center: [lng, lat] })
    })
  }

  render () {
    const { classes, id } = this.props
    return (
      <div
        id={ id }
        className={ classes.root }
      >
      </div>
    )
  }
}

Map.propTypes = propTypes
export default withStyles(styles)(Map)

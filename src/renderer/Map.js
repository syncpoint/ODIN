import React from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { K } from '../shared/combinators'

class Map extends React.Component {
  componentDidMount () {
    const { id, options } = this.props

    this.map = K(L.map(id, options))(map => {
      const url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      const options = { maxZoom: 19 }
      new L.TileLayer(url, options).addTo(map)
      map._container.focus()
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

Map.propTypes = {
  classes: PropTypes.any.isRequired,
  options: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired
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

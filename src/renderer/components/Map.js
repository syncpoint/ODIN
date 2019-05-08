import React from 'react'
import L from 'leaflet'
import { K } from '../../shared/combinators'
import './Map.css'


class Map extends React.Component {

  componentDidMount() {
    const {id, options, tileProvider} = this.props
    this.map = K(L.map(id, options))(map => {
      L.tileLayer(tileProvider.url, tileProvider).addTo(map)
    })
  }

  render() {
    return <div id={ this.props.id } className={ this.props.className }></div>
  }
}

export default Map
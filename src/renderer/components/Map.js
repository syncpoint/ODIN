import React from 'react'
import L from 'leaflet'
import { K } from '../../shared/combinators'
import 'leaflet/dist/leaflet.css'
import './Map.css'


// https://github.com/PaulLeCam/react-leaflet/issues/255
// Stupid hack so that leaflet's images work after going through webpack.
import marker from 'leaflet/dist/images/marker-icon.png';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: marker2x,
    iconUrl: marker,
    shadowUrl: markerShadow
});

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
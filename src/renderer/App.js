import React, { useEffect, useState } from 'react'
import { withStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import './layer-loader'
import LeafletMap from './Map-leaflet'
import OpenLayersMap from './Map-openlayers'
import MapboxMap from './Map-mapbox'
import { map as mapSettings } from './settings'

const MAPS = {
  leaflet: LeafletMap,
  openLayers: OpenLayersMap,
  mapbox: MapboxMap
}

const App = () => {
  const [ viewport, setViewport ] = useState(null)
  const viewportChanged = mapSettings.setViewport
  const loadViewport = () => mapSettings.getViewport().then(setViewport)
  const effect = R.compose(R.always(undefined), loadViewport)

  useEffect(effect, [])

  const props = {
    viewport,
    viewportChanged,
    id: 'map'
  }

  const Map = MAPS.openLayers
  const map = viewport ? <Map { ...props }/> : null
  return <div>{ map }</div>
}

App.propTypes = {}
const styles = {}
export default withStyles(styles)(App)

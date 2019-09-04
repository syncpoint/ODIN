import EventEmitter from 'events'
import React from 'react'
import { ListItemText, ListItemAvatar, Avatar } from '@material-ui/core'
import L from 'leaflet'
import ms from 'milsymbol'
import layerStore from '../stores/layer-store'
import evented from '../evented'


export default register => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  const featureItem = (layerId, layerName) => ([featureId, feature]) => {
    const [lng, lat] = feature.geometry.coordinates
    const symbolOptions = { simpleStatusModifier: true }
    const url = new ms.Symbol(feature.properties.sidc, symbolOptions).asCanvas().toDataURL()
    return {
      key: `feature://${layerId}/${featureId}`,
      avatar: (
        <ListItemAvatar>
          <Avatar src={ url } style={{ borderRadius: 0, width: '15%', height: '15%' }} />
        </ListItemAvatar>
      ),
      text: <ListItemText primary={ feature.title } secondary={ `${layerName.toUpperCase()}` }/>,
      action: () => evented.emit('map.center', L.latLng(lat, lng))
    }
  }

  const contribution = () => Object.entries(layerStore.state())
    .reduce((acc, [layerId, { name: layerName, show, features }]) => {
      if (!show) return acc
      if (!term()) return acc

      const items = Object.entries(features)
        .filter(([_, feature]) => feature.title)
        .filter(([_, feature]) => feature.properties.sidc)
        .filter(([_, feature]) => feature.geometry)
        .filter(([_, feature]) => feature.geometry.type === 'Point')
        .filter(([_, feature]) => feature.title.search(new RegExp(term(), 'i')) !== -1)
        .sort((a, b) => a[1].title.localeCompare(b[1].title))
        .map(featureItem(layerId, layerName))

      // TODO: limit item count?
      return acc.concat(items)
    }, [])

  contributor.updateFilter = () => contributor.emit('updated', contribution())
  layerStore.on('event', event => {
    contributor.emit('updated', contribution())
  })
}

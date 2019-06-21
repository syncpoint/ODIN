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

  const contribution = () => {
    if (!term()) return []

    const items = Object.entries(layerStore.state())
      .reduce((acc, [_, layer]) => {
        if (!layer.show) return acc
        const { features } = layer.content
        const xs = features
          .filter(feature => {
            if (!feature.title) return false
            if (!feature.geometry) return false
            if (feature.geometry.type !== 'Point') return false
            return feature.title.search(new RegExp(term(), 'i')) !== -1
          })
          .sort((a, b) => a.title.localeCompare(b.title))
          .map(feature => {
            const [lng, lat] = feature.geometry.coordinates
            const url = new ms.Symbol(feature.properties.sidc).asCanvas().toDataURL()
            return {
              key: feature.id,
              avatar: (
                <ListItemAvatar>
                  <Avatar src={ url } style={{ borderRadius: 0, width: '15%', height: '15%' }} />
                </ListItemAvatar>
              ),
              text: <ListItemText primary={ feature.title } secondary={ 'Feature' }/>,
              action: () => evented.emit('map.center', L.latLng(lat, lng))
            }
          })
        return acc.concat(xs)
      }, [])


    // Limit features to n entries.
    return items.slice(0, 12)
  }

  contributor.updateFilter = () => contributor.emit('updated', contribution())
}

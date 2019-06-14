import EventEmitter from 'events'
import React from 'react'
import { ListItemText } from '@material-ui/core'
import uuid from 'uuid-random'
import L from 'leaflet'
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
            if (!feature.id) return false
            if (feature.id === '.') return false
            if (feature.geometry.type !== 'Point') return false
            return feature.id.search(new RegExp(term(), 'i')) !== -1
          })
          .map(feature => {
            const [lng, lat] = feature.geometry.coordinates
            return {
              key: uuid(),
              text: <ListItemText primary={ feature.id } secondary={ 'Feature' }/>,
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

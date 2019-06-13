import EventEmitter from 'events'
import React from 'react'
import { ListItemText } from '@material-ui/core'
import layerStore from '../stores/layer-store'

export default register => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  const contribution = () => {
    term()
    const items = Object.entries(layerStore.state())
      .filter(() => true)
      .reduce((acc, [name, layer]) => {
        const { features } = layer.content
        const xs = features
          .filter(feature => {
            if (!feature.id) return false
            if (feature.id === '.') return false
            if (feature.geometry.type !== 'Point') return false
            return feature.id.search(new RegExp(term(), 'i')) !== -1
          })
          .map(feature => ({
            key: `feature://${name}/${feature.id}`,
            text: <ListItemText primary={ feature.id } secondary={ 'Feature' }/>
          }))
        return acc.concat(xs)
      }, [])

    return items
  }

  if (layerStore.ready()) contributor.emit('updated', contribution())
  else layerStore.once('ready', () => contributor.emit('updated', contribution()))

  contributor.updateFilter = () => contributor.emit('updated', contribution())
}

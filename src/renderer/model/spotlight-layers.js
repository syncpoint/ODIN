import React from 'react'
import { ListItemText, ListItemSecondaryAction, Switch } from '@material-ui/core'
import layerStore from '../stores/layer-store'

const layers = options => term => {

  const handleToggle = name => () => {
    if (!name) {
      const state = layerStore.state()
      const show = Object.values(state)[0].show
      if (show) layerStore.hideAll()
      else layerStore.showAll()
    } else {
      const show = layerStore.state()[name].show
      if (show) layerStore.hide(name)
      else layerStore.show(name)
    }
  }

  const items = Object.entries(layerStore.state())
    .filter(([name, _]) => name.search(new RegExp(term, 'i')) !== -1)
    .map(([name, features]) => {
      const tags = name.split(':').splice(1)
      tags.unshift('Layer')

      return {
        key: `layer://${name}`,
        text: (
          <div>
            <ListItemText primary={ name } secondary={ tags.join(' ') }/>
            <ListItemSecondaryAction>
              <Switch edge="end"/>
            </ListItemSecondaryAction>
          </div>
        ),
        action: handleToggle(name),
        delete: () => layerStore.remove(name)
      }
    })

  // Add 'master switch':
  if (items.length) {
    items.unshift({
      key: `layer://`,
      text: (
        <div>
          <ListItemText primary={ 'All Layers' } secondary={ 'Layer' }/>
          <ListItemSecondaryAction>
            <Switch edge="end"/>
          </ListItemSecondaryAction>
        </div>
      ),
      action: handleToggle(),
      delete: () => layerStore.removeAll()
    })
  }

  return Promise.resolve(items)
}

export default layers

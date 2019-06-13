import EventEmitter from 'events'
import React from 'react'
import LayerListItem from '../components/spotlight/LayerListItem'
import layerStore from '../stores/layer-store'

export default register => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  const contribution = () => {
    const filter = term()
      ? ([name, _]) => name.search(new RegExp(term(), 'i')) !== -1
      : () => true

    const handleChange = name => checked => {
      if (!name && checked === undefined) {
        Object.values(layerStore.state()).some(features => features.show)
          ? layerStore.hideAll()
          : layerStore.showAll()
      } else {
        setImmediate(() => {
          (checked ? layerStore.show : layerStore.hide)(name)
        })
      }
    }

    const items = Object.entries(layerStore.state())
      .filter(filter)
      .map(([name, features]) => ({
        name,
        tags: ['Layer', ...name.split(':').splice(1)],
        checked: features.show,
        onChange: handleChange(name)
      })).map(props => ({
        key: `layer://${props.name}`,
        text: <LayerListItem { ...props }/>,
        action: () => handleChange(props.name)(!props.checked),
        delete: () => layerStore.remove(props.name)
      }))

    // Add 'master switch':
    if (items.length) {
      const showSome = Object.values(layerStore.state()).some(fatures => fatures.show)
      const props = {
        name: 'All Layers',
        tags: ['Layer'],
        checked: showSome,
        onChange: handleChange()
      }
      items.unshift({
        key: `layer://`,
        text: <LayerListItem { ...props }/>,
        action: handleChange(),
        delete: () => layerStore.removeAll()
      })
    }

    return items
  }

  if (layerStore.ready()) contributor.emit('updated', contribution())
  else layerStore.once('ready', () => contributor.emit('updated', contribution()))

  layerStore.on('shown', () => contributor.emit('updated', contribution()))
  layerStore.on('hidden', () => contributor.emit('updated', contribution()))
  layerStore.on('added', () => contributor.emit('updated', contribution()))
  layerStore.on('removed', () => contributor.emit('updated', contribution()))
  contributor.updateFilter = () => contributor.emit('updated', contribution())
}

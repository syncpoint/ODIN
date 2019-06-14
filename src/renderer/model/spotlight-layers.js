import EventEmitter from 'events'
import React from 'react'
import LayerListItem from '../components/spotlight/LayerListItem'
import store from '../stores/layer-store'

export default register => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  const contribution = () => {
    const filter = term()
      ? ([name, _]) => name.search(new RegExp(term(), 'i')) !== -1
      : () => true

    const handleChange = name => checked => {
      if (!name && checked === undefined) {
        Object.values(store.state()).some(features => features.show)
          ? store.hideAll()
          : store.showAll()
      } else {
        setImmediate(() => {
          (checked ? store.show : store.hide)(name)
        })
      }
    }

    const items = Object.entries(store.state())
      .filter(filter)
      .map(([name, features]) => {
        const [label, ...tags] = name.split(':')
        return {
          name,
          label,
          tags: ['Layer', ...tags],
          checked: features.show,
          onChange: handleChange(name)
        }
      })
      .map(props => ({
        key: `layer://${props.name}`,
        text: <LayerListItem { ...props }/>,
        action: () => handleChange(props.name)(!props.checked),
        delete: () => store.remove(props.name),
        name: props.name,
        checked: props.checked
      }))

    // Add 'master switch' for layers currently included in list:
    if (items.length) {
      const names = items.map(item => item.name)
      const checked = items.some(item => item.checked)

      const props = {
        label: 'All Layers',
        tags: ['Layer'],
        checked: checked,
        onChange: () => checked ? store.hideAll(names) : store.showAll(names)
      }
      items.unshift({
        key: `layer://`,
        text: <LayerListItem { ...props }/>,
        action: () => checked ? store.hideAll(names) : store.showAll(names),
        delete: () => store.removeAll(names)
      })
    }

    return items
  }

  if (store.ready()) contributor.emit('updated', contribution())
  else store.once('ready', () => contributor.emit('updated', contribution()))

  store.on('shown', () => contributor.emit('updated', contribution()))
  store.on('hidden', () => contributor.emit('updated', contribution()))
  store.on('added', () => contributor.emit('updated', contribution()))
  store.on('removed', () => contributor.emit('updated', contribution()))
  contributor.updateFilter = () => contributor.emit('updated', contribution())
}

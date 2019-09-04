import EventEmitter from 'events'
import React from 'react'
import LayerListItem from '../components/spotlight/LayerListItem'
import store from '../stores/layer-store'

export default register => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  const filter = () => term()
    ? ([_, { name }]) => name.search(new RegExp(term(), 'i')) !== -1
    : () => true

  const handleChange = layerId => checked => {
    if (checked === undefined) {
      Object.values(store.state()).some(layer => layer.show)
        ? store.hideLayer()
        : store.showLayer()
    } else {
      setImmediate(() => (checked ? store.showLayer : store.hideLayer)([layerId]))
    }
  }

  const layerItem = (layerId, layerName, show) => {
    const [label, ...tags] = layerName.split(':')
    const props = { label, tags: ['Layer', ...tags], checked: show, onChange: handleChange(layerId) }
    return {
      key: `layer://${layerId}`,
      text: <LayerListItem { ...props }/>,
      action: () => handleChange(layerId)(!show),
      delete: () => store.deleteLayer([layerId]),
      name: layerName,
      checked: show
    }
  }

  const contribution = () => {
    const items = Object.entries(store.state())
      .filter(filter())
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .reduce((acc, [layerId, { name: layerName, show }]) => {
        return [...acc, layerItem(layerId, layerName, show)]
      }, [])

    // Add 'master switch' for layers currently included in list:
    if (items.length) {
      const checked = items.some(item => item.checked)

      const props = {
        label: 'All Layers',
        tags: ['Layer'],
        checked: checked,
        onChange: () => checked ? store.hideLayer() : store.showLayer()
      }

      items.unshift({
        key: `layer://`,
        text: <LayerListItem { ...props }/>,
        action: () => checked ? store.hideLayer() : store.showLayer(),
        delete: () => store.deleteLayer()
      })
    }

    return items
  }

  // store.register(event => {
  //   console.log('[spotlight-layers]', event)
  // })

  if (store.ready()) contributor.emit('updated', contribution())
  else store.once('ready', () => contributor.emit('updated', contribution()))

  store.on('event', () => contributor.emit('updated', contribution()))
  contributor.updateFilter = () => contributor.emit('updated', contribution())
}

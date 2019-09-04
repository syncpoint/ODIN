import EventEmitter from 'events'
import React from 'react'
import LayerListItem from '../components/spotlight/LayerListItem'
import store from '../stores/layer-store'
import { ResourceNames } from './resource-names'

export default register => {
  let replaying = true
  let state = {}
  const contributor = new EventEmitter()
  const term = register(contributor)

  const filter = () => term()
    ? ([_, { name }]) => name.search(new RegExp(term(), 'i')) !== -1
    : () => true

  const layerItem = (layerId, name, checked) => {
    const [label, ...tags] = name.split(':')
    const props = { label, tags: ['Layer', ...tags], checked }

    return {
      key: ResourceNames.layerId(layerId),
      text: <LayerListItem { ...props }/>,
      action: () => setImmediate(() => (checked ? store.hideLayer : store.showLayer)([layerId])),
      delete: () => store.deleteLayer([layerId]),
      name,
      checked
    }
  }

  const masterSwitch = items => {
    const checked = items.some(item => item.checked)
    const props = {
      label: 'All Layers',
      tags: ['Layer'],
      checked: checked
    }

    items.unshift({
      key: 'urn:layer:',
      text: <LayerListItem { ...props }/>,
      action: () => checked ? store.hideLayer() : store.showLayer(),
      delete: () => store.deleteLayer()
    })
  }

  const contribution = () => {
    const items = Object.entries(state)
      .filter(filter())
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .reduce((acc, [layerId, { name, checked }]) => {
        return [...acc, layerItem(layerId, name, checked)]
      }, [])

    // Add 'master switch' for layers currently included in list:
    if (items.length) masterSwitch(items)
    return items
  }

  contributor.updateFilter = () => contributor.emit('updated', contribution())

  const handlers = {
    'snapshot': ({ snapshot }) => Object.entries(snapshot).reduce((acc, [layerId, { name, show: checked }]) => {
      acc[layerId] = { name, checked }
      return acc
    }, state),
    'replay-ready': () => (replaying = false),
    'layer-added': ({ layerId, name, show }) => (state[layerId] = { name, checked: show }),
    'layer-deleted': ({ layerId }) => delete state[layerId],
    'layer-hidden': ({ layerId }) => (state[layerId].checked = false),
    'layer-shown': ({ layerId }) => (state[layerId].checked = true)
  }

  store.register(event => {
    if (!handlers[event.type]) return
    handlers[event.type](event)
    if (replaying) return
    contributor.emit('updated', contribution())
  })
}

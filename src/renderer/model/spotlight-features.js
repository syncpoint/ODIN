import EventEmitter from 'events'
import React from 'react'
import { ListItemText } from '@material-ui/core'
import L from 'leaflet'
import ms from 'milsymbol'
import store from '../stores/layer-store'
import evented from '../evented'
import { ResourceNames } from './resource-names'
import ListItemSymbol from '../components/ListItemSymbol'

export default register => {
  let replaying = true
  let state = {}
  const contributor = new EventEmitter()
  const term = register(contributor)

  const featureItem = (layerId, layerName) => ([featureId, feature]) => {
    const [lng, lat] = feature.geometry.coordinates
    const symbolOptions = { simpleStatusModifier: true }
    const url = new ms.Symbol(feature.properties.sidc, symbolOptions).asCanvas().toDataURL()
    return {
      key: ResourceNames.featureId(layerId, featureId),
      avatar: <ListItemSymbol src={ url }/>,
      text: <ListItemText primary={ feature.title } secondary={ `${layerName}` }/>,
      action: () => evented.emit('map.center', L.latLng(lat, lng)),
      delete: () => store.deleteFeature(layerId)([featureId])
    }
  }

  const contribution = () => {
    if (!term()) return []

    return Object.entries(state)
      .filter(([_, layer]) => layer.show)
      .reduce((acc, [layerId, { name, features }]) => {
        const items = Object.entries(features)
          .filter(([_, feature]) => feature.title)
          .filter(([_, feature]) => feature.properties.sidc)
          .filter(([_, feature]) => feature.geometry)
          .filter(([_, feature]) => feature.geometry.type === 'Point')
          .filter(([_, feature]) => feature.title.search(new RegExp(term(), 'i')) !== -1)
          .sort((a, b) => a[1].title.localeCompare(b[1].title))
          .map(featureItem(layerId, name))

        // TODO: limit item count?
        return acc.concat(items)
      }, [])
  }

  contributor.updateFilter = () => contributor.emit('updated', contribution())

  const handlers = {
    'snapshot': ({ snapshot }) => (state = snapshot),
    'replay-ready': () => (replaying = false),
    'layer-added': ({ layerId, name, show }) => (state[layerId] = { name, show, features: {} }),
    'layer-deleted': ({ layerId }) => delete state[layerId],
    'layer-hidden': ({ layerId }) => (state[layerId].show = false),
    'layer-shown': ({ layerId }) => (state[layerId].show = true),
    'feature-added': ({ layerId, featureId, feature }) => (state[layerId].features[featureId] = feature),
    'feature-updated': ({ layerId, featureId, feature }) => (state[layerId].features[featureId] = feature),
    'feature-deleted': ({ layerId, featureId }) => delete state[layerId].features[featureId]
  }

  store.register(event => {
    if (!handlers[event.type]) return
    handlers[event.type](event)
    if (replaying) return
    contributor.emit('updated', contribution())
  })
}

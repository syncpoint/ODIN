import EventEmitter from 'events'
import React from 'react'
import { ListItemText } from '@material-ui/core'
import L from 'leaflet'
import poiStore from '../stores/poi-store'
import evented from '../evented'

export default register => {
  const contributor = new EventEmitter()
  const term = register(contributor)

  const contribution = () => {
    const filter = term()
      ? ([_, poi]) => poi.name && poi.name.search(new RegExp(term(), 'i')) !== -1
      : () => true

    return Object.entries(poiStore.state())
      .filter(filter)
      .map(([uuid, poi]) => ({
        key: uuid,
        text: <ListItemText primary={ poi.name } secondary={ 'POI' }/>,
        action: () => evented.emit('map.center', L.latLng(poi.lat, poi.lng)),
        delete: () => poiStore.remove(uuid)
      }))
  }

  if (poiStore.ready()) contributor.emit('updated', contribution())
  else poiStore.once('ready', () => contributor.emit('updated', contribution()))
  poiStore.on('removed', () => contributor.emit('updated', contribution()))
  contributor.updateFilter = () => contributor.emit('updated', contribution())
}


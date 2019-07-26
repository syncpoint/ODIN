import EventEmitter from 'events'
import React from 'react'
import { ListItemText } from '@material-ui/core'
import L from 'leaflet'
import poiStore from '../stores/poi-store'
import evented from '../evented'

const bounds = poi => {
  const { lat, lng, latlngs } = poi
  if (latlngs) {
    return L.latLngBounds(poi.latlngs[0])
  } else if (lat && lng) {
    return L.latLng(lat, lng).toBounds(10)
  }
}

const action = poi => bounds(poi)
  ? () => evented.emit('map.center', bounds(poi).getCenter())
  : () => {}

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
        action: action(poi),
        delete: () => poiStore.remove(uuid)
      }))
  }

  if (poiStore.ready()) contributor.emit('updated', contribution())
  else poiStore.once('ready', () => contributor.emit('updated', contribution()))
  poiStore.on('removed', () => contributor.emit('updated', contribution()))
  contributor.updateFilter = () => contributor.emit('updated', contribution())
}

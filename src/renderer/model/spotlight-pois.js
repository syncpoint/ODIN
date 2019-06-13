import React from 'react'
import { ListItemText } from '@material-ui/core'
import L from 'leaflet'
import store from '../stores/poi-store'

const pois = options => term => {
  const { context } = options
  const items = Object.entries(store.state())
    .filter(([_, poi]) => poi.name && poi.name.search(new RegExp(term, 'i')) !== -1)
    .map(([uuid, poi]) => ({
      key: uuid,
      text: <ListItemText primary={ poi.name } secondary={ 'POI' }/>,
      action: () => context.setCenter(L.latLng(poi.lat, poi.lng)),
      delete: () => store.remove(uuid)
    }))

  return Promise.resolve(items)
}

export default pois

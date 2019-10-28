import featureSetData from '../stores/featureSetStore'
import { ListItemText } from '@material-ui/core'
import React from 'react'
import { featureListFromSidc } from './mapPalette-feature'
import settings from '../model/settings'

const featureSet = () => {
  const data = featureSetData()
  const sets = data.map(element => ({
    key: element.name,
    text: <ListItemText primary={ element.name }/>,
    open: false,
    features: featureListFromSidc(element.content)
  }))

  const recentlyUsed = settings.palette.getRecentlyUsed()
  recentlyUsed
    ? sets.unshift(createVirtualSet(recentlyUsed, 'Recently Used'))
    : sets.unshift(createVirtualSet([], 'Recently Used'))

  const index = settings.palette.getOpenedSetIndex()
  if (index > -1) sets[index].open = true
  return sets
}

const createVirtualSet = (features, name) => {
  return {
    key: name,
    text: <ListItemText primary={ name }/>,
    open: false,
    features: featureListFromSidc(features)
  }
}


export default featureSet

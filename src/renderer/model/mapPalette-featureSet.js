import featureSetData from '../stores/featureSetStore'
import { ListItemText } from '@material-ui/core'
import React from 'react'
import { featureListFromSidc } from './mapPalette-feature'

const featureSet = () => {
  const data = featureSetData()
  return data.map(element => ({
    key: element.name,
    text: <ListItemText primary={ element.name }/>,
    open: false,
    features: featureListFromSidc(element.content)
  }))
}

export default featureSet

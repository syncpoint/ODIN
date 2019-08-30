import featureSetData from '../stores/featureSetStore'
import { ListItemText } from '@material-ui/core'
import React from 'react'
import { symbolListFromSidc } from './mapPalette-symbol'

const featureSet = () => {
  const data = featureSetData()
  return data.map(element => ({
    key: element.name,
    text: <ListItemText primary={ element.name }/>,
    open: false,
    symbols: symbolListFromSidc(element.content)
  }))
}

export default featureSet

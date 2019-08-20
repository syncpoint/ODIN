import symbolSetData from '../stores/symbolSetStore'
import { ListItemText } from '@material-ui/core'
import React from 'react'
import { symbolListFromSidc } from './mapPalette-symbol'

const symbolSet = () => {
  const data = symbolSetData()
  return data.map(element => ({
    key: element.name,
    text: <ListItemText primary={ element.name }/>,
    open: false,
    symbols: symbolListFromSidc(element.content)
  }))
}

export default symbolSet

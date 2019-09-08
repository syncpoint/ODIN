import React from 'react'
import { ListItemText } from '@material-ui/core'
import ms from 'milsymbol'
import { findSpecificItem } from '../stores/feature-store'
import ListItemSymbol from '../components/ListItemSymbol'

const placeholderSymbol = new ms.Symbol('')
const specificSIDC = sidc => sidc[0] + 'F' + sidc[2] + '-' + sidc.substring(4)

const avatar = sidc => {
  const symbol = new ms.Symbol(sidc)
  const url = symbol.isValid(false)
    ? symbol.asCanvas().toDataURL()
    : placeholderSymbol.asCanvas().toDataURL()

  return <ListItemSymbol src={ url }/>
}

const featureListFromSidc = list => {
  return list.map(element => {
    const sidc = specificSIDC(element.sidc)
    const elementInfo = findSpecificItem(element.sidc)
    return toObject(elementInfo, sidc)
  })
}

const featureList = list => {
  return list.map(element => {
    const sidc = specificSIDC(element.sidc)
    return toObject(element, sidc)
  })
}

const toObject = (element, sidc) => {
  return {
    key: element.name,
    sidc: sidc,
    text: <ListItemText primary={ element.name } secondary={ element.info } />,
    avatar: avatar(sidc)
  }
}

export { featureList, featureListFromSidc }

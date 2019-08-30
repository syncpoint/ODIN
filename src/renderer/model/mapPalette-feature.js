import React from 'react'
import { ListItemText, ListItemAvatar, Avatar } from '@material-ui/core'
import ms from 'milsymbol'
import { findSpecificItem } from '../stores/feature-store'

const placeholderFeature = new ms.Symbol('')
const specificSIDC = sidc => sidc[0] + 'F' + sidc[2] + '-' + sidc.substring(4)

const avatar = sidc => {

  const feature = new ms.Symbol(sidc)
  const url = feature.isValid(false)
    ? feature.asCanvas().toDataURL()
    : placeholderFeature.asCanvas().toDataURL()

  return (
    <ListItemAvatar>
      <Avatar src={ url } style={{ borderRadius: 0, width: '15%', height: '15%' }} />
    </ListItemAvatar>
  )
}

// TODO: remove duplicate code

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

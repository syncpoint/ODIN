import React from 'react'
import { ListItemText, ListItemAvatar, Avatar } from '@material-ui/core'
import ms from 'milsymbol'
import { findSpecificItem } from '../stores/feature-store'


const specificSIDC = sidc => sidc[0] + 'F' + sidc[2] + '-' + sidc.substring(4)

const avatar = sidc => {
  const url = new ms.Symbol(sidc[0] === 'G' ? '' : sidc).asCanvas().toDataURL()
  return (
    <ListItemAvatar>
      <Avatar src={ url } style={{ borderRadius: 0, width: '15%', height: '15%' }} />
    </ListItemAvatar>
  )
}

// TODO: remove duplicate code

const symbolListFromSidc = list => {
  return list.map(element => {
    const sidc = specificSIDC(element.sidc)
    const elementInfo = findSpecificItem(element.sidc)

    return {
      key: elementInfo.name,
      sidc: sidc,
      text: <ListItemText primary={ elementInfo.name } secondary={ elementInfo.info } />,
      avatar: avatar(sidc)
    }
  })
}

const symbolList = list => {
  return list.map(element => {
    const sidc = specificSIDC(element.sidc)
    return {
      key: element.name,
      sidc: sidc,
      text: <ListItemText primary={ element.name } secondary={ element.info } />,
      avatar: avatar(sidc)
    }
  })
}


export { symbolList, symbolListFromSidc }

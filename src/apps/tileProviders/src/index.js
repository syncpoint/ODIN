import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

import ProviderList from './ProviderList'

import { K } from '../../../shared/combinators'
import { ipcRenderer } from 'electron'

const rootId = 'tileManagementRoot'

// Create root </div> to mount application in:
document.body.appendChild(K(document.createElement('div'))(div => {
  div.id = rootId
}))

function App () {
  const [ tileProviders, setTileProviders ] = useState([])

  const onDelete = providerToDelete => {
    const providers = tileProviders.filter(provider => provider.id !== providerToDelete.id)
    setTileProviders(providers)
  }

  useEffect(() => {
    ipcRenderer.on('tile-providers-loaded', (event, providers) => {
      console.dir(providers)
      setTileProviders(providers)
    })
    return function cleanup () {
      console.log('cleanup')
    }
  })
  return (
    <ProviderList providers={tileProviders} onDelete={onDelete}/>
  )
}

ReactDOM.render(
  <App />,
  document.getElementById(rootId)
)

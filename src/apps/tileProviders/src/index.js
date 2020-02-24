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
    /* see event handler in main.js */
    ipcRenderer.send('tile-providers-changed', providers)
  }

  useEffect(() => {
    const register = (event, providers) => {
      console.dir(providers)
      setTileProviders(providers)
    }
    ipcRenderer.on('tile-providers-loaded', register)
    return function cleanup () {
      ipcRenderer.removeListener('tile-providers-loaded', register)
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

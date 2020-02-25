import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

import ProviderList from './ProviderList'
import ProviderEditor from './ProviderEditor'

import { K } from '../../../shared/combinators'
import { ipcRenderer } from 'electron'
import uuid from 'uuid-random'

const rootId = 'tileManagementRoot'

// Create root </div> to mount application in:
document.body.appendChild(K(document.createElement('div'))(div => {
  div.id = rootId
}))

function App () {

  const [ tileProviders, setTileProviders ] = useState([])
  const [ currentProvider, setCurrentProvider ] = useState(null)

  // fire message to main process when tileProviders changes
  useEffect(() => {
    ipcRenderer.send('tile-providers-changed', tileProviders)
  }, [ tileProviders ])

  // subscribe and unsubscribe to message from main process
  // no dependencies to props or other variables that change over time
  useEffect(() => {
    const register = (event, providers) => {
      setTileProviders(providers)
    }
    ipcRenderer.once('tile-providers-loaded', register)

    // get's called when react unmounts the component
    return function cleanup () {
      ipcRenderer.removeListener('tile-providers-loaded', register)
    }
  }, [])

  const handleDelete = providerToDelete => {
    const providers = tileProviders.filter(provider => provider.id !== providerToDelete.id)
    setTileProviders(providers)
    /* see event handler in main.js */
    ipcRenderer.send('tile-providers-changed', providers)
  }

  const handleEditStart = provider => {
    setCurrentProvider(provider)
  }

  const handlEditDone = provider => {
    if (!provider) return setCurrentProvider(null)
    if (!provider.id) {
      // new provider
      provider['id'] = uuid()
      const providers = [...tileProviders, provider]
      setTileProviders(providers)
    } else {
      // existing provider, keep index within the array
      const providerIndex = tileProviders.findIndex(existingProvider => existingProvider.id === provider.id)
      const providers = [...tileProviders]
      providers[providerIndex] = provider
      setTileProviders(providers)
    }
    setCurrentProvider(null)
  }

  if (currentProvider) {
    return (
      <ProviderEditor provider={currentProvider} handleDone={handlEditDone}/>
    )
  }
  return (
    <ProviderList providers={tileProviders} handleEdit={handleEditStart} handleDelete={handleDelete}/>
  )
}

ReactDOM.render(
  <App />,
  document.getElementById(rootId)
)

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

import ProviderListItem from './ProviderListItem'
import ProviderEditor from './ProviderEditor'

import { Fab, List } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'

import { K } from '../../../shared/combinators'
import { ipcRenderer } from 'electron'
import uuid from 'uuid-random'

const rootId = 'tileManagementRoot'

// Create root </div> to mount application in:
document.body.appendChild(K(document.createElement('div'))(div => {
  div.id = rootId
}))

// CSS inline styles
const stickyHeaderStyle = {
  margin: '0 auto',
  position: 'sticky',
  top: 0
}

// helper used to enable/disable buttons
const hasAtLeastOneElement = tileProviders => tileProviders.length > 0
const hasOnlyOneElement = tileProviders => tileProviders.length === 1

function App () {

  const [ tileProviders, setTileProviders ] = useState([])
  const [ currentProvider, setCurrentProvider ] = useState(null)

  // watch 'tileProviders' and send message to main process when tileProviders changes
  useEffect(() => {
    if (hasAtLeastOneElement(tileProviders)) {
      ipcRenderer.send('tile-providers-changed', tileProviders)
    }
  }, [ tileProviders ])

  // subscribe and unsubscribe to message from main process
  // no dependencies to props or other variables that change over time
  useEffect(() => {
    const register = (event, providers) => {
      setTileProviders(providers)
    }
    ipcRenderer.on('tile-providers-loaded', register)

    // get's called when react unmounts the component
    return function cleanup () {
      ipcRenderer.removeListener('tile-providers-loaded', register)
    }
  }, [])

  // user interaction handlers
  const handleDelete = providerToDelete => {
    const providers = tileProviders.filter(provider => provider.id !== providerToDelete.id)
    setTileProviders(providers)
  }

  const handleEditStart = provider => {
    setCurrentProvider(provider)
  }

  const handleNewProviderStart = () => {
    setCurrentProvider({})
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

  // an array of provider items
  const Items = tileProviders.map(provider =>
    <ProviderListItem key={provider.id} provider={provider} handleEdit={handleEditStart} handleDelete={handleDelete} disableDelete={hasOnlyOneElement(tileProviders)}/>
  )

  if (currentProvider) {
    return (
      <ProviderEditor provider={currentProvider} handleDone={handlEditDone}/>
    )
  }
  return (
    <React.Fragment>
      <div style={stickyHeaderStyle}>
        <Fab color="primary" onClick={handleNewProviderStart}>
          <AddIcon />
        </Fab>
      </div>
      <List dense>
        {Items}
      </List>
    </React.Fragment>
  )
}

ReactDOM.render(
  <App />,
  document.getElementById(rootId)
)

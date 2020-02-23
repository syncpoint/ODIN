import React from 'react'
import PropTypes from 'prop-types'
import { List } from '@material-ui/core'
import ProviderListItem from './ProviderListItem'

const ProviderList = props => {
  const { providers, onDelete } = props
  if (!providers) return null

  const Items = providers.map(provider =>
    <ProviderListItem key={provider.id} provider={provider} onDelete={onDelete}/>
  )
  return (
    <List dense>
      {Items}
    </List>
  )
}
ProviderList.propTypes = {
  providers: PropTypes.array,
  onDelete: PropTypes.func
}

export default ProviderList

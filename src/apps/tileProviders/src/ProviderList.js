import React from 'react'
import PropTypes from 'prop-types'
import { List } from '@material-ui/core'
import ProviderListItem from './ProviderListItem'

const ProviderList = props => {
  const { providers, handleEdit, handleDelete } = props
  if (!providers) return null

  const Items = providers.map(provider =>
    <ProviderListItem key={provider.id} provider={provider} handleEdit={handleEdit} handleDelete={handleDelete}/>
  )
  return (
    <List dense>
      {Items}
    </List>
  )
}
ProviderList.propTypes = {
  providers: PropTypes.array,
  handleEdit: PropTypes.func,
  handleDelete: PropTypes.func
}

export default ProviderList

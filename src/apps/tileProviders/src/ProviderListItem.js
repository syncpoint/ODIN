import React from 'react'
import PropTypes from 'prop-types'
import { IconButton, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import DragHandleIcon from '@material-ui/icons/DragHandle'
import DeleteForeverIcon from '@material-ui/icons/DeleteForever'

const ProviderListItem = props => {
  const { provider } = props
  const { handleEdit, handleDelete } = props
  if (!provider) return null
  return (
    <ListItem button onClick={() => handleEdit(provider)}>
      <ListItemIcon>
        <DragHandleIcon edge="start" />
      </ListItemIcon>
      <ListItemText primary={provider.name} secondary={provider.url} />
      <ListItemSecondaryAction>
        <IconButton edge="end" onClick={() => handleDelete(provider)}>
          <DeleteForeverIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  )
}
ProviderListItem.propTypes = {
  provider: PropTypes.object,
  handleDelete: PropTypes.func,
  handleEdit: PropTypes.func
}

export default ProviderListItem

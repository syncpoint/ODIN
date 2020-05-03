import React from 'react'
import PropTypes from 'prop-types'
import {
  List, ListItem,
  ListItemText, ListItemSecondaryAction,
  IconButton
} from '@material-ui/core'
import EditIcon from '@material-ui/icons/Edit'

const SourceDescriptorList = props => {
  const { sourceDescriptors, selectedDescriptor } = props
  return (
    <List>
      { sourceDescriptors ? sourceDescriptors.map(descriptor => (
        <ListItem key={descriptor.name} button
          selected={selectedDescriptor && selectedDescriptor.id === descriptor.id}
          onClick={() => props.onDescriptorSelected(descriptor)}>
          <ListItemText primary={descriptor.name} />
          <ListItemSecondaryAction>
            <IconButton edge="end" onClick={() => props.onDescriptorEdit(descriptor)}>
              <EditIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      )) : null
      }
    </List>
  )
}
SourceDescriptorList.propTypes = {
  sourceDescriptors: PropTypes.array,
  selectedDescriptor: PropTypes.object,
  onDescriptorSelected: PropTypes.func,
  onDescriptorEdit: PropTypes.func
}

export default SourceDescriptorList

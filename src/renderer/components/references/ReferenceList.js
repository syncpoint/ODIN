import React from 'react'
import PropTypes from 'prop-types'
import { IconButton, Link, List, ListItem, ListItemSecondaryAction } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/DeleteForeverOutlined'

const ReferenceList = props => {
  const { references = [], onDelete = () => {} } = props

  return (
    <List >
      {references.sort((l, r) => {
        if (l.name === r.name) return 0
        return (l.name < r.name ? -1 : 1)
      }).map(
        reference => <ListItem key={reference.id} disableGutters >
          <Link variant='body2' href={reference.url} style={{ overflow: 'hidden' }}>{reference.name}</Link>
          <ListItemSecondaryAction>
            <IconButton edge='end' onClick={() => onDelete(reference.url)}>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      )}

    </List>
  )
}
ReferenceList.propTypes = {
  references: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired
}

export default ReferenceList

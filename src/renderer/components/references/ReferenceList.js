import React from 'react'
import PropTypes from 'prop-types'
import { Link, List, ListItem, ListItemSecondaryAction } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/DeleteForeverOutlined'

const ReferenceList = props => {
  const { references = [], onClick, onDelete = () => {} } = props

  return (
    <List>
      {references.map(
        reference => <ListItem key={reference.id} >
          <Link variant='body2' href={reference.url} onClick={onClick}>{reference.name}</Link>
          <ListItemSecondaryAction>
            <DeleteIcon onClick={() => onDelete(reference.id)}/>
          </ListItemSecondaryAction>
        </ListItem>
      )}

    </List>
  )
}
ReferenceList.propTypes = {
  references: PropTypes.array.isRequired,
  onClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}

export default ReferenceList

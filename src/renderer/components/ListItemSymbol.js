import React from 'react'
import PropTypes from 'prop-types'
import { ListItemAvatar, Avatar } from '@material-ui/core'

const ListItemSymbol = props => (
  <ListItemAvatar style={{ width: '20%', marginTop: 0 }}>
    <Avatar
      src={ props.src }
      style={{
        borderRadius: 0,
        marginRight: 14,
        width: 'auto',
        height: 'auto'
      }}
    />
  </ListItemAvatar>
)

export default ListItemSymbol

ListItemSymbol.propTypes = {
  src: PropTypes.string.isRequired
}

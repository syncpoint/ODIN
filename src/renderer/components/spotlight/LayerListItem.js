import React from 'react'
import { ListItemText, ListItemSecondaryAction, Switch } from '@material-ui/core'
import PropTypes from 'prop-types'

const LayerListItem = props => (
  <div>
    <ListItemText primary={ props.label } secondary={ props.tags.join(' ') }/>
    <ListItemSecondaryAction>
      <Switch
        edge="end"
        checked={ props.checked }
      />
    </ListItemSecondaryAction>
  </div>
)

LayerListItem.propTypes = {
  tags: PropTypes.array.isRequired,
  checked: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired
}

export default LayerListItem

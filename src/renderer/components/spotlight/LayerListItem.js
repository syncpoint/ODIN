import React from 'react'
import { IconButton, ListItemText, ListItemSecondaryAction, Switch, ListItemIcon } from '@material-ui/core'
import SaveAlt from '@material-ui/icons/SaveAlt'
import PropTypes from 'prop-types'

const SecondaryAction = p => {
  if (!p.func) return null
  return (
    <ListItemSecondaryAction>
      <IconButton edge="end" onClick={ p.func }>
        <SaveAlt />
      </IconButton>
    </ListItemSecondaryAction>
  )
}

const LayerListItem = props => (
  <React.Fragment>
    <ListItemIcon>
      <Switch edge="start" checked={ props.checked } />
    </ListItemIcon>
    <ListItemText primary={ props.label } secondary={ props.tags.join(' ') }/>
    <SecondaryAction func={ props.onSecondaryActionClicked } />
  </React.Fragment>
)

LayerListItem.propTypes = {
  tags: PropTypes.array.isRequired,
  checked: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onSecondaryActionClicked: PropTypes.func
}

export default LayerListItem

import React from 'react'
import { IconButton, ListItemText, ListItemSecondaryAction, Switch, ListItemIcon } from '@material-ui/core'
import SaveAlt from '@material-ui/icons/SaveAlt'
import PropTypes from 'prop-types'
import { exportLayerPrompt } from '../../filesystem/layer-fs'


/**
 *
 */
const ExportLayerButton = props => {
  if (!props.layerId) return null

  const exportLayer = event => {
    event.stopPropagation()
    exportLayerPrompt(props.layerId)
  }

  return (
    <ListItemSecondaryAction>
      <IconButton edge="end" onClick={ exportLayer }>
        <SaveAlt />
      </IconButton>
    </ListItemSecondaryAction>
  )
}

ExportLayerButton.propTypes = {
  layerId: PropTypes.string.isRequired
}


/**
 *
 */
const LayerListItem = props => (
  <React.Fragment>
    <ListItemIcon>
      <Switch edge="start" checked={ props.checked } />
    </ListItemIcon>
    <ListItemText primary={ props.label } secondary={ props.tags.join(' ') }/>
    <ExportLayerButton layerId={ props.layerId } />
  </React.Fragment>
)

LayerListItem.propTypes = {
  tags: PropTypes.array.isRequired,
  checked: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  layerId: PropTypes.string.isRequired
}

export default LayerListItem

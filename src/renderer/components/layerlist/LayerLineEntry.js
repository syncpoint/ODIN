import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import Collapse from '@material-ui/core/Collapse'
import IconButton from '@material-ui/core/IconButton'
import LockIcon from '@material-ui/icons/Lock'
import LockOpenIcon from '@material-ui/icons/LockOpen'
import VisibilityIcon from '@material-ui/icons/Visibility'
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff'

import inputLayers from '../../project/input-layers'
import { FeatureItem } from './FeatureItem'

const useStyles = makeStyles((/* theme */) => ({
  item: {
    paddingLeft: '8px',
    borderBottom: '1px solid #cccccc'
  },

  'item:selected': {
    display: 'grid',
    gridGap: '10px',
    gridTemplateColumns: 'auto auto',
    gridTemplateAreas: '"L R"',
    padding: '8px 8px', // top/bottom left/right
    borderBottom: '1px solid #cccccc',
    backgroundColor: 'red'
  }
}))

export const LayerLineEntry = props => {
  const classes = useStyles()

  // TODO: move to LayerList with global key listener?
  const onLayerItemKey = event => {
    switch (event.key) {
      case 'Enter': return props.activateEditor()
      case 'Backspace': return inputLayers.removeLayer(props.id)
    }
  }

  return (
    <div key={props.id}>
      <ListItem
        button
        className={classes.item}
        onDoubleClick={() => inputLayers.activateLayer(props.id)}
        onClick={props.selectLayer}
        selected={props.selected}
        onKeyDown={onLayerItemKey}
      >
        { props.active ? <b>{props.name}</b> : props.name }
        <ListItemSecondaryAction>
          <IconButton size='small' onClick={() => inputLayers.toggleLayerLock(props.id)}>
            {props.locked ? <LockIcon/> : <LockOpenIcon/>}
          </IconButton>
          <IconButton size='small' onClick={() => inputLayers.toggleLayerShow(props.id)}>
            {props.hidden ? <VisibilityOffIcon/> : <VisibilityIcon/>}
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
      <Collapse in={props.expanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {
            Object.values(props.features)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(feature => <FeatureItem key={feature.id} { ...feature }/>)
          }
        </List>
      </Collapse>
    </div>
  )
}

LayerLineEntry.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  features: PropTypes.object.isRequired,
  active: PropTypes.bool, // optional, false if omitted
  selected: PropTypes.bool, // optional, false if omitted
  locked: PropTypes.bool, // optional, false if omitted
  hidden: PropTypes.bool, // optional, false if omitted
  expanded: PropTypes.bool, // optional, false if omitted
  selectLayer: PropTypes.func.isRequired,
  activateEditor: PropTypes.func.isRequired
}

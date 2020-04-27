import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import Collapse from '@material-ui/core/Collapse'

import Paper from '@material-ui/core/Paper'
import IconButton from '@material-ui/core/IconButton'
import LockIcon from '@material-ui/icons/Lock'
import LockOpenIcon from '@material-ui/icons/LockOpen'
import VisibilityIcon from '@material-ui/icons/Visibility'
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff'

import Tooltip from './Tooltip.js'
import { registerReducer, deregisterReducer } from '../map/layers.js'
import evented from '../evented'
import { K } from '../../shared/combinators'

import {
  LayersMinus,
  LayersPlus,
  ExportVariant,
  ContentDuplicate
} from 'mdi-material-ui'

const useStyles = makeStyles((theme) => ({
  panel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    fontFamily: 'Roboto',
    overflow: 'auto'
  },

  buttonGroup: {
    padding: '8px',
    display: 'flex',
    justifyContent: 'flex-end'
  },

  list: {
    maxHeight: '0px'
  },

  item: {
    paddingLeft: '8px',
    borderBottom: '1px solid #cccccc'
  },

  feature: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)'
  },

  'item:selected': {
    display: 'grid',
    gridGap: '10px',
    gridTemplateColumns: 'auto auto',
    gridTemplateAreas: '"L R"',
    padding: '8px 8px', // top/bottom left/right
    borderBottom: '1px solid #cccccc',
    backgroundColor: 'red'
  },

  itemLeft: {
    gridArea: 'L',
    alignSelf: 'center',
    userSelect: 'none'
  },

  itemRight: {
    gridArea: 'R',
    justifySelf: 'end',
    alignSelf: 'center'
  }
}))

const Body = props => {
  const classes = useStyles()
  const { children } = props
  return (
    <>
      <div className={classes.itemLeft}>
        {children}
      </div>
    </>
  )
}

Body.propTypes = {
  children: PropTypes.any
}

const actions = [
  { icon: <LayersPlus/>, tooltip: 'Add Layer' },
  { icon: <LayersMinus/>, tooltip: 'Delete Layer' },
  { icon: <ContentDuplicate/>, tooltip: 'Duplicat Layer' },
  { icon: <ExportVariant/>, tooltip: 'Share layer' }
]

const reducer = (state, event) => {
  console.log('[LayerList] reducer', event)
  switch (event.type) {
    case 'snapshot': return event.layers.reduce((acc, layer) => K(acc)(acc => {
      acc[layer.id] = layer
    }), {})
    case 'layerAdded': {
      const updatedState = { ...state }
      updatedState[event.layer.id] = event.layer
      return updatedState
    }
    case 'layerHidden': {
      const updatedState = { ...state }
      updatedState[event.id].hidden = event.hidden
      return updatedState
    }
    case 'layerLocked': {
      const updatedState = { ...state }
      updatedState[event.id].locked = event.locked
      return updatedState
    }
    case 'layerActivated': {
      const updatedState = { ...state }
      Object.values(updatedState).forEach(layer => (layer.active = false))
      updatedState[event.id].active = true
      return updatedState
    }
    default: return state
  }
}

const LayerList = (/* props */) => {
  const classes = useStyles()

  const [selectedItem, setSelectedItem] = React.useState(null)
  const [layers, dispatch] = React.useReducer(reducer, {})
  const [expanded, setExpanded] = React.useState(null)

  const selectlayer = id => () => {
    setSelectedItem(id)
    setExpanded(expanded === id ? null : id)
  }

  const activatelayer = id => () => {
    // TODO: update persistent project model
    dispatch({ type: 'layerActivated', id })
    evented.emit('OSD_MESSAGE', { message: layers[id].name, slot: 'A2' })
  }

  React.useEffect(() => {
    console.log('[LayerList] mounting.')
    registerReducer(dispatch)
    return () => {
      console.log('[LayerList] unmounting.')
      deregisterReducer(dispatch)
    }
  }, [])


  const onLock = layer => () => evented.emit('layer.toggleLock', layer.id)
  const onShow = layer => () => evented.emit('layer.toggleShow', layer.id)

  const buttons = () => actions.map(({ icon, tooltip }, index) => (
    <Tooltip key={index} title={tooltip} >
      <IconButton size='small'>
        { icon }
      </IconButton>
    </Tooltip>
  ))

  const layer = layer => {
    const lockIcon = layer.locked ? <LockIcon/> : <LockOpenIcon/>
    const visibleIcon = layer.hidden ? <VisibilityOffIcon/> : <VisibilityIcon/>
    const body = layer.active ? <b>{layer.name}</b> : layer.name
    const selected = selectedItem === layer.id

    return (
      <div key={layer.id}>
        <ListItem
          button
          // dense
          className={classes.item}
          onDoubleClick={ activatelayer(layer.id) }
          onClick={ selectlayer(layer.id) }
          selected={selected}
        >
          {/* {selected ? <ExpandMore/> : <ExpandLess/> } */}
          { body }
          <ListItemSecondaryAction>
            <IconButton size='small' onClick={onLock(layer)}>
              {lockIcon}
            </IconButton>
            <IconButton size='small' onClick={onShow(layer)}>
              {visibleIcon}
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        <Collapse in={expanded === layer.id} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {
              layer.features.map(feature => (
                <ListItem
                  className={classes.feature}
                  key={feature.id}
                  button
                >
                  { feature.t }
                </ListItem>
              ))
            }
          </List>
        </Collapse>
      </div>
    )
  }

  return (
    <Paper className={classes.panel} elevation={6}>
      {/* <ButtonGroup/> not supported for <IconButton> */}
      <div className={classes.buttonGroup}>
        { buttons() }
      </div>
      <List className={classes.list}>
        { Object.values(layers).map(layer) }
      </List>
    </Paper>
  )
}

export default LayerList

import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
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
    fontFamily: 'Roboto'
  },

  buttonGroup: {
    padding: '8px',
    display: 'flex',
    justifyContent: 'flex-end'
  },

  item: {
    display: 'grid',
    gridGap: '10px',
    gridTemplateColumns: 'auto auto',
    gridTemplateAreas: '"L R"',
    padding: '8px 8px', // top/bottom left/right
    borderBottom: '1px solid #cccccc'
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
    default: return state
  }
}

const LayerList = props => {

  const [layers, dispatch] = React.useReducer(reducer, {})

  React.useEffect(() => {
    registerReducer(dispatch)
    return () => deregisterReducer(dispatch)
  }, [])


  const classes = useStyles()
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
    const body = layer.selected ? <b>{layer.name}</b> : layer.name
    return (
      <div
        key={layer.id}
        className={classes.item}
        onDoubleClick={ event => console.log('doubleClick', event)}
      >
        <Body>{body}</Body>
        <div className={classes.itemRight}>
          <Tooltip title="Lock Layer" >
            <IconButton size='small' onClick={onLock(layer)}>
              {lockIcon}
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle Visibility" >
            <IconButton size='small' onClick={onShow(layer)}>
              {visibleIcon}
            </IconButton>
          </Tooltip>
        </div>
      </div>
    )
  }

  return (
    <Paper className={classes.panel} elevation={6}>
      {/* <ButtonGroup/> not supported for <IconButton> */}
      <div className={classes.buttonGroup}>
        { buttons() }
      </div>
      <List>{ Object.values(layers).map(layer) }</List>
    </Paper>
  )
}

export default LayerList

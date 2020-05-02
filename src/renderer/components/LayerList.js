import { ipcRenderer } from 'electron'
import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import Collapse from '@material-ui/core/Collapse'
import { InputBase } from '@material-ui/core'

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
import selection from '../selection'

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
    display: 'flex',
    flexDirection: 'column'
  },

  buttons: {
    padding: '8px',
    display: 'flex',
    justifyContent: 'flex-end'
  },

  search: {
    paddingLeft: '8px',
    paddingRight: '8px',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    fontSize: '120%',
    userSelect: 'none'
  },

  listContainer: {
    height: '100%',
    overflow: 'auto'
  },

  list: {
    maxHeight: '0px' // ?!
  },

  item: {
    paddingLeft: '8px',
    borderBottom: '1px solid #cccccc'
  },

  feature: {
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
  { icon: <ContentDuplicate/>, tooltip: 'Duplicate Layer' },
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

  const [selectedLayer, setSelectedLayer] = React.useState(null)
  const [selectedFeatures, setSelectedFeatures] = React.useState([])
  const [layers, dispatch] = React.useReducer(reducer, {})
  const [expanded, setExpanded] = React.useState(null)

  const selectLayer = id => () => {
    setExpanded(expanded === id ? null : id)
    if (selectedLayer === id) return

    selection.deselect()
    selection.select([id])
  }

  const selectedFeature = id => () => {
    selection.deselect()
    selection.select([id])
  }


  React.useEffect(() => {
    const selected = () => {
      const layerIds = selection.selected('layer:')
      if (layerIds && layerIds.length) {
        // No multi-select for now; take first selected.
        setSelectedLayer(layerIds[0])
      }

      setSelectedFeatures(selection.selected('feature:'))
    }

    const deselected = uris => {
      const layerIds = uris.filter(s => s.startsWith('layer:'))
      if (layerIds && layerIds.length) setSelectedLayer(null)
      const featureIds = uris.filter(s => s.startsWith('feature:'))
      const remaining = selectedFeatures.filter(id => !featureIds.includes(id))
      setSelectedFeatures(remaining)
    }

    selection.on('selected', selected)
    selection.on('deselected', deselected)

    return () => {
      selection.off('selected', selected)
      selection.off('deselected', deselected)
    }
  }, [])


  const activateLayer = id => () => {
    // TODO: update persistent project model
    dispatch({ type: 'layerActivated', id })
    evented.emit('OSD_MESSAGE', { message: layers[id].name, slot: 'A2' })
  }

  React.useEffect(() => {
    registerReducer(dispatch)
    return () => deregisterReducer(dispatch)
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
    const selected = selectedLayer === layer.id

    return (
      <div key={layer.id}>
        <ListItem
          button
          // dense
          className={classes.item}
          onDoubleClick={activateLayer(layer.id)}
          onClick={selectLayer(layer.id)}
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
                  onClick={selectedFeature(feature.id)}
                  selected={selectedFeatures.includes(feature.id)}
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

  // Search: Prevent undo/redo when not focused.
  const [readOnly, setReadOnly] = React.useState(false)
  const ref = React.useRef()
  const selectAll = React.useCallback(() => {
    const input = ref.current
    input.setSelectionRange(0, input.value.length)
  }, [])

  const onBlur = () => {
    ipcRenderer.removeListener('IPC_EDIT_SELECT_ALL', selectAll)
    setReadOnly(true)
  }

  const onFocus = () => {
    ipcRenderer.on('IPC_EDIT_SELECT_ALL', selectAll)
    setReadOnly(false)
  }

  return (
    <Paper className={classes.panel} elevation={6}>
      {/* <ButtonGroup/> not supported for <IconButton> */}
      <div className={classes.buttons}>
        { buttons() }
      </div>
      <InputBase
        className={classes.search}
        placeholder={'Search...'}
        autoFocus
        inputRef={ref}
        readOnly={readOnly}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <div className={classes.listContainer}>
        <List className={classes.list}>
          { Object.values(layers).map(layer) }
        </List>
      </div>
    </Paper>
  )
}

export default LayerList

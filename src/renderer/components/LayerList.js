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
import { K, I, uniq } from '../../shared/combinators'
import selection from '../selection'
import inputLayers from '../project/input-layers'
import Feature from '../project/Feature'
import URI from '../project/URI'

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

  editor: {
    paddingLeft: '8px',
    paddingTop: '2px',
    paddingBottom: '1px',
    borderBottom: '1px solid #cccccc',
    width: '100%'
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
  { icon: <LayersPlus/>, tooltip: 'Add Layer', disabled: true },
  { icon: <LayersMinus/>, tooltip: 'Delete Layer', disabled: true },
  { icon: <ContentDuplicate/>, tooltip: 'Duplicate Layer', disabled: true },
  { icon: <ExportVariant/>, tooltip: 'Share layer', disabled: true }
]


/**
 * FeatureItem.
 */
const FeatureItem = props => {
  const classes = useStyles()

  const selectFeature = id => () => {
    selection.deselect()
    selection.select([id])
  }

  return (
    <ListItem
      className={classes.feature}
      onClick={selectFeature(props.id)}
      selected={props.selected}
      button
    >
      { props.name }
    </ListItem>
  )
}

FeatureItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  selected: PropTypes.bool // optional, false if oomitted
}


const addFeatures = (next, features) =>
  features.forEach(feature => {
    const layerId = Feature.layerId(feature)
    const featureId = Feature.id(feature)
    next[layerId].features[featureId] = {
      id: featureId,
      name: feature.getProperties().t
    }
  })

const elementById = next => id =>
  URI.isLayerId(id)
    ? next[id]
    : next[URI.layerId(id)].features[id]

const layerEventHandlers = {
  snapshot: (prev, { layers, features }) => K({ ...prev })(next => {
    layers.forEach(layer => (next[layer.id] = { ...layer, features: {} }))
    addFeatures(next, features)
  }),

  featuresadded: (prev, { features }) => K({ ...prev })(next => {
    addFeatures(next, features)

    // Update lock/hidden layer states.
    features
      .map(Feature.layerId)
      .filter(uniq)
      .forEach(layerId => {
        next[layerId].locked = features.some(Feature.locked)
        next[layerId].hidden = features.some(Feature.hidden)
      })
  }),

  featuresremoved: (prev, { ids }) => K({ ...prev })(next => {
    ids.forEach(id => delete next[URI.layerId(id)].features[id])
  }),

  layerlocked: (prev, { layerId, locked }) => K({ ...prev })(next => {
    next[layerId].locked = locked
  }),

  layerhidden: (prev, { layerId, hidden }) => K({ ...prev })(next => {
    next[layerId].hidden = hidden
  }),

  layeractivated: (prev, { layerId }) => K({ ...prev })(next => {
    Object.values(next).forEach(layer => (layer.active = false))
    next[layerId].active = true
  }),

  layerdeactivated: (prev, { layerId }) => K({ ...prev })(next => {
    delete next[layerId].active
  }),

  layerrenamed: (prev, { layerId, name }) => K({ ...prev })(next => {
    next[layerId].name = name
  }),

  layerremoved: (prev, { layerId }) => K({ ...prev })(next => {
    delete next[layerId]
  }),

  // internal events =>

  deselected: (prev, { ids }) => K({ ...prev })(next => {
    ids.map(elementById(next)).forEach(element => delete element.selected)
  }),

  selected: (prev, { ids }) => K({ ...prev })(next => {
    ids.map(elementById(next)).forEach(element => (element.selected = true))
  }),

  layerexpanded: (prev, { layerId }) => K({ ...prev })(next => {
    Object.keys(next).forEach(id => (next[id].expanded = id === layerId))
  })
}


/**
 * Handle input layer events.
 * NOTE: Functions must be pure and must allow to be called twice for same event.
 */
const LayerList = (/* props */) => {
  const classes = useStyles()
  const reducer = (state, event) => (layerEventHandlers[event.type] || I)(state, event)
  const [layers, dispatch] = React.useReducer(reducer, {})

  // layerEditor :: { layerId, name }
  const [layerEditor, setLayerEditor] = React.useState({})

  // Sync selection with component state:
  React.useEffect(() => {
    const selected = ids => dispatch({ type: 'selected', ids })
    const deselected = ids => dispatch({ type: 'deselected', ids })

    selection.on('selected', selected)
    selection.on('deselected', deselected)

    return () => {
      selection.off('selected', selected)
      selection.off('deselected', deselected)
    }
  }, [])

  // Reduce input layer events to component state:
  React.useEffect(() => {
    inputLayers.register(dispatch)
    return () => inputLayers.deregister(dispatch)
  }, [])

  const lockLayer = layer => () => inputLayers.toggleLayerLock(layer.id)
  const showLayer = layer => () => inputLayers.toggleLayerShow(layer.id)
  const activateLayer = id => () => inputLayers.activateLayer(id)

  const toggleLayerEditor = layer => {
    if (layerEditor.layerId === layer.id) {
      inputLayers.renameLayer(layerEditor.layerId, layerEditor.name)
      setLayerEditor({})
    } else {
      dispatch({ type: 'layerexpanded' })
      setLayerEditor({ layerId: layer.id, name: layer.name })
    }
  }

  const selectLayer = layer => event => {
    // Ignore keyboard events, i.e. 'Enter':
    if (event.nativeEvent instanceof KeyboardEvent) return
    dispatch({ type: 'layerexpanded', layerId: layer.expanded ? null : layer.id })
    if (layer.selected) return
    selection.deselect()
    selection.select([layer.id])
  }

  const onLayerItemKey = layer => event => {
    switch (event.key) {
      case 'Enter': return toggleLayerEditor(layer)
      case 'Backspace': return inputLayers.deleteLayer(layer.id)
    }
  }

  const onLayerEdiorKey = layer => event => {
    switch (event.key) {
      case 'Enter': return toggleLayerEditor(layer)
      case 'Escape': return setLayerEditor({})
    }
  }

  const onLayerEditorChange = event => {
    setLayerEditor({ ...layerEditor, name: event.target.value })
  }

  const buttons = () => actions.map(({ icon, tooltip, disabled, action }, index) => (
    <Tooltip key={index} title={tooltip}>
      {/* </span> needed for disabled </Tooltip> child. */}
      <span>
        <IconButton size='small' disabled={disabled} onClick={action}>
          { icon }
        </IconButton>
      </span>
    </Tooltip>
  ))

  const layerLineEntry = layer => {
    const lockIcon = layer.locked ? <LockIcon/> : <LockOpenIcon/>
    const visibleIcon = layer.hidden ? <VisibilityOffIcon/> : <VisibilityIcon/>
    const body = layer.active ? <b>{layer.name}</b> : layer.name

    return (
      <div key={layer.id}>
        <ListItem
          button
          className={classes.item}
          onDoubleClick={activateLayer(layer.id)}
          onClick={selectLayer(layer)}
          selected={layer.selected}
          onKeyDown={onLayerItemKey(layer)}
        >
          { body }
          <ListItemSecondaryAction>
            <IconButton size='small' onClick={lockLayer(layer)}>
              {lockIcon}
            </IconButton>
            <IconButton size='small' onClick={showLayer(layer)}>
              {visibleIcon}
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        <Collapse in={layer.expanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {
              Object.values(layer.features)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(feature => <FeatureItem key={feature.id} { ...feature }/>)
            }
          </List>
        </Collapse>
      </div>
    )
  }

  const layerNameEditor = layer =>
    <InputBase
      className={classes.editor}
      key={`${layer.id}#editor`}
      value={layerEditor.name}
      autoFocus
      onKeyDown={onLayerEdiorKey(layer)}
      onChange={onLayerEditorChange}
    />

  const layerItem = layer =>
    layerEditor.layerId === layer.id
      ? layerNameEditor(layer)
      : layerLineEntry(layer)

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
        disabled
      />
      <div className={classes.listContainer}>
        <List className={classes.list}>
          {
            Object.values(layers)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(layerItem)
          }
        </List>
      </div>
    </Paper>
  )
}

export default LayerList

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
  selected: PropTypes.bool // optional, false if omitted
}

/**
 *
 */

const LayerNameEditor = props => {
  const classes = useStyles()

  const onChange = event => props.update(event.target.value)
  const onKeyDown = event => {
    switch (event.key) {
      case 'Enter': return props.commit()
      case 'Escape': return props.cancel()
    }
  }

  return (
    <InputBase
      className={classes.editor}
      value={props.value}
      autoFocus
      onKeyDown={onKeyDown}
      onChange={onChange}
    />
  )
}

LayerNameEditor.propTypes = {
  value: PropTypes.string.isRequired,
  cancel: PropTypes.func.isRequired,
  commit: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}


/**
 * LayerLineEntry.
 */
const LayerLineEntry = props => {
  const classes = useStyles()

  const onLayerItemKey = event => {
    switch (event.key) {
      case 'Enter': return props.activateEditor()
      case 'Backspace': return inputLayers.deleteLayer(props.id)
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
    delete next[layerId].editor
  }),

  layerremoved: (prev, { layerId }) => K({ ...prev })(next => {
    delete next[layerId]
  }),

  // internal events =>

  deselected: (prev, { ids }) => K({ ...prev })(next =>
    ids
      .map(elementById(next))
      .filter(I)
      .forEach(element => delete element.selected)
  ),

  selected: (prev, { ids }) => K({ ...prev })(next =>
    ids
      .map(elementById(next))
      .filter(I)
      .forEach(element => (element.selected = true))
  ),

  layerexpanded: (prev, { layerId }) => K({ ...prev })(next => {
    Object.keys(next).forEach(id => (next[id].expanded = id === layerId))
  }),

  editoractivated: (prev, { layerId }) => K({ ...prev })(next => {
    next[layerId].editor = next[layerId].name
  }),

  editorupdated: (prev, { layerId, value }) => K({ ...prev })(next => {
    next[layerId].editor = value
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

  const selectLayer = layerId => event => {
    // Ignore keyboard events, i.e. 'Enter':
    if (event.nativeEvent instanceof KeyboardEvent) return

    const expanded = layers[layerId].expanded
    dispatch({ type: 'layerexpanded', layerId: expanded ? null : layerId })

    if (!layers[layerId].selected) {
      selection.deselect()
      selection.select([layerId])
    }
  }

  const activateEditor = layerId => () => {
    dispatch({ type: 'layerexpanded' })
    dispatch({ type: 'editoractivated', layerId })
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


  const layerItem = layer =>
    layer.editor
      ? <LayerNameEditor
        key={`${layer.id}#editor`}
        value={layer.editor}
        update={value => dispatch({ type: 'editorupdated', layerId: layer.id, value })}
        cancel={() => dispatch({ type: 'editordeactivated', layerId: layer.id })}
        commit={() => inputLayers.renameLayer(layer.id, layer.editor)}
      />
      : <LayerLineEntry
        key={`${layer.id}#editor`}
        { ...layer }
        selectLayer={selectLayer(layer.id)}
        activateEditor={activateEditor(layer.id)}
      />

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

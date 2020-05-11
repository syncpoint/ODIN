import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import Paper from '@material-ui/core/Paper'

import { I } from '../../../shared/combinators'
import selection from '../../selection'
import inputLayers from '../../project/input-layers'
import { LayerNameEditor } from './LayerNameEditor'
import { LayerLineEntry } from './LayerLineEntry'
import { Search } from './Search'
import { Actions } from './Actions'
import handlers from './LayerList-handlers'

const useStyles = makeStyles((/* theme */) => ({
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

  listContainer: {
    height: '100%',
    overflow: 'auto'
  },

  list: {
    maxHeight: '0px' // ?!
  }
}))


const LayerList = (/* props */) => {
  const classes = useStyles()
  const reducer = (state, event) => (handlers[event.type] || I)(state, event)
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

  const layerItem = layer =>
    (typeof layer.editor === 'string')
      ? <LayerNameEditor
        key={`${layer.id}#editor`}
        value={layer.editor}
        update={value => dispatch({ type: 'editorupdated', layerId: layer.id, value })}
        cancel={() => dispatch({ type: 'editordeactivated', layerId: layer.id })}
        commit={() => inputLayers.renameLayer(layer.id, layer.editor)}
      />
      : <LayerLineEntry
        key={layer.id}
        { ...layer }
        selectLayer={selectLayer(layer.id)}
        activateEditor={activateEditor(layer.id)}
      />

  const sortedLayers = () =>
    Object.values(layers)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(layerItem)

  return (
    <Paper className={classes.panel} elevation={6}>
      {/* <ButtonGroup/> not supported for <IconButton> */}
      <div className={classes.buttons}>
        <Actions/>
      </div>
      <Search/>

      {/* Necessary to make overflow/scroll work. */}
      <div className={classes.listContainer}>
        <List className={classes.list}>
          { sortedLayers() }
        </List>
      </div>
    </Paper>
  )
}

export default LayerList

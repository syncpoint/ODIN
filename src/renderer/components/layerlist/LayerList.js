import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import Paper from '@material-ui/core/Paper'
import Mousetrap from 'mousetrap'

import { I } from '../../../shared/combinators'
import selection from '../../selection'
import inputLayers from '../../project/input-layers'
import { LayerNameEditor } from './LayerNameEditor'
import { LayerLineEntry } from './LayerLineEntry'
import { Search } from './Search'
import { Actions } from './Actions'
import handlers from './LayerList-handlers'
import URI from '../../project/URI'

const collatorOptions = { numeric: true, sensitivity: 'base' }
const naturalCollator = new Intl.Collator(undefined, collatorOptions)

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

  const selectedLayerId = () => {
    const selected = selection.selected(URI.isLayerId)
    return selected.length ? selected[0] : null
  }

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

  const handleEnterKey = () => {
    dispatch({ type: 'layerexpanded' })
    dispatch({ type: 'editoractivated', layerId: selectedLayerId() })
  }

  React.useEffect(() => {
    const mousetrap = new Mousetrap()

    // Ignore if event originated from map or no layer is selected:
    mousetrap.stopCallback = (_, element) => {
      if (element.id === 'map') return true
      if (!selectedLayerId()) return true
      return false
    }

    mousetrap.bind('enter', handleEnterKey)
    return () => mousetrap.reset()
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

  const layerItem = layer =>
    (typeof layer.editor === 'string')
      ? <LayerNameEditor
        key={`${layer.id}#editor`}
        value={layer.editor}
        error={layer.error}
        update={value => dispatch({ type: 'editorupdated', layerId: layer.id, value })}
        cancel={() => dispatch({ type: 'editordeactivated', layerId: layer.id })}
        commit={() => inputLayers.renameLayer(layer.id, layer.editor)}
      />
      : <LayerLineEntry
        key={layer.id}
        { ...layer }
        selectLayer={selectLayer(layer.id)}
      />

  const sortedLayers = () => Object.values(layers)
    .sort((a, b) => naturalCollator.compare(a.name, b.name))
    .map(layerItem)

  return (
    <Paper
      className={classes.panel}
      elevation={6}
    >
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

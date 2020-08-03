import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Search from './Search'
import { featureDescriptors } from '../feature-descriptors'
import Presets from './Presets'
import evented from '../../evented'
import preferences from '../../project/preferences'
import selection from '../../selection'

import FeatureList from './FeatureList'

const useStyles = makeStyles((theme) => ({
  panel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    fontFamily: 'Roboto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch'
  },

  buttons: {
    padding: '8px',
    display: 'flex',
    justifyContent: 'flex-end'
  },

  toggleContainer: {
    margin: theme.spacing(0, 0),
    marginRight: '16px'
  },

  list: {
    margin: theme.spacing(1),
    display: 'flex',
    flexGrow: 1
  }
}))

const FeaturePalette = (/* props */) => {

  const DEFAULT_FILTER = ''
  const DEFAULT_PRESETS = {
    installation: null,
    status: 'P',
    hostility: 'F',
    schema: 'S',
    battleDimension: []
  }

  const classes = useStyles()
  const [showing, setShowing] = React.useState(true)
  const [height, setHeight] = React.useState(0)
  const [filter, setFilter] = React.useState(null)
  const [presets, setPresets] = React.useState(null)

  React.useEffect(() => {
    const hide = () => setShowing(false)
    const show = () => setShowing(true)

    evented.on('MAP_DRAW', hide)
    evented.on('MAP_DRAWEND', show)

    return () => {
      evented.off('MAP_DRAW', hide)
      evented.off('MAP_DRAWEND', show)
    }
  }, [])

  React.useEffect(() => {
    const memento = preferences.get('paletteMemento')
    const { filter = DEFAULT_FILTER, presets = DEFAULT_PRESETS } = memento || {}
    setFilter(filter)
    setPresets(presets)
  }, [])

  React.useEffect(() => {
    const memento = preferences.get('paletteMemento') || {}
    memento.filter = filter
    memento.presets = presets
    preferences.set('paletteMemento', memento)
  }, [filter, presets])

  const detectListHeigth = React.useCallback(element => {
    if (!element) return
    const currentHeight = element.getBoundingClientRect().height
    if (currentHeight !== height) setHeight(currentHeight)
  }, [])

  const updateFilter = newFilter => {
    if (newFilter !== filter) setFilter(newFilter)
  }

  const updatePresets = newPresets => {
    if (presets !== newPresets) setPresets(newPresets)
  }

  const itemSelected = descriptor => () => {
    selection.deselect()
    evented.emit('MAP_DRAW', descriptor)
  }

  if (filter === null || !presets) return null

  const listItems = featureDescriptors(filter, presets)

  return (
    <Paper
      className={classes.panel}
      elevation={6}
      style={{ display: showing ? 'flex' : 'none' }}
    >
      <div className={classes.buttons}>
        <Presets value={presets} onChange={updatePresets}/>
      </div>
      <Search initialValue={filter} onChange={updateFilter}/>
      <div className={classes.list} ref={detectListHeigth}>
        <FeatureList classes={classes} listItems={listItems} handleClick={itemSelected} height={height}/>
      </div>
    </Paper>
  )
}

export default FeaturePalette

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

  // const memento = preferences.get('paletteMemento')

  const classes = useStyles()
  const [showing, setShowing] = React.useState(true)
  const [height, setHeight] = React.useState(0)
  const [filter, setFilter] = React.useState('')
  const [presets, setPresets] = React.useState({
    installation: null,
    status: 'P',
    hostility: 'F',
    schema: 'S',
    battleDimension: []
  })

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
    if (!memento) return
    const { filter, presets } = memento
    if (filter) setFilter(filter)
    if (presets) setPresets(presets)
  }, [])

  const detectListHeigth = React.useCallback(element => {
    if (!element) return
    const currentHeight = element.getBoundingClientRect().height
    if (currentHeight !== height) setHeight(currentHeight)
  }, [])

  const updateFilter = filter => {
    setFilter(filter)
    const memento = preferences.get('paletteMemento') || {}
    memento.filter = filter
    preferences.set('paletteMemento', memento)
  }

  const updatePresets = presets => {
    setPresets(presets)
    const memento = preferences.get('paletteMemento') || {}
    memento.presets = presets
    preferences.set('paletteMemento', memento)
  }

  const itemSelected = descriptor => () => {
    selection.deselect()
    evented.emit('MAP_DRAW', descriptor)
  }

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
      <Search value={filter} onChange={updateFilter}/>
      <div className={classes.list} ref={detectListHeigth}>
        <FeatureList classes={classes} listItems={listItems} handleClick={itemSelected} height={height}/>
      </div>
    </Paper>
  )
}

export default FeaturePalette

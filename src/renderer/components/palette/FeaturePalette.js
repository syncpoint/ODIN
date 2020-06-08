import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import List from '@material-ui/core/List'

import Search from './Search'
import { featureDescriptors } from '../feature-descriptors'
import FeatureItem from './FeatureItem'
import Presets from './Presets'
import evented from '../../evented'
import preferences from '../../project/preferences'
import selection from '../../selection'

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

  toggleContainer: {
    margin: theme.spacing(0, 0),
    marginRight: '16px'
  },

  listContainer: {
    height: '100%',
    overflow: 'auto'
  },

  list: {
    maxHeight: '0px' // ?!
  }
}))



const FeaturePalette = (/* props */) => {
  const classes = useStyles()
  const [showing, setShowing] = React.useState(true)
  const [filter, setFilter] = React.useState('')
  const [presets, setPresets] = React.useState({
    installation: null,
    status: 'P',
    hostility: 'F'
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
    .map(descriptor => <FeatureItem
      {...descriptor}
      key={descriptor.sortkey}
      onClick={itemSelected(descriptor)}
    />)

  const content = listItems.length
    ? listItems
    : <div style={{ marginLeft: 8 }}>Recently used features will appear here.</div>

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
      <div className={classes.listContainer}>
        <List className={classes.list}>
          {content}
        </List>
      </div>
    </Paper>
  )
}

export default FeaturePalette

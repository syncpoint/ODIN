import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import List from '@material-ui/core/List'
import Search from './Search'
import descriptors from '../feature-descriptors'
import FeatureItem from './FeatureItem'
import Presets from './Presets'
import evented from '../../evented'

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
  const [preset, setPreset] = React.useState({
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
      evented.off('MAP_DRAWSTART', hide)
      evented.off('MAP_DRAWEND', show)
    }
  }, [])

  const listItems = () => {
    if (!filter || filter.length < 3) return []
    return descriptors
      .featureDescriptors(filter, preset)
      .map(descriptor => <FeatureItem key={descriptor.sortkey} {...descriptor}/>)
  }

  return (
    <Paper
      className={classes.panel}
      elevation={6}
      style={{ display: showing ? 'flex' : 'none' }}
    >
      <div className={classes.buttons}>
        <Presets value={preset} onChange={setPreset}/>
      </div>
      <Search value={filter} onChange={setFilter}/>
      <div className={classes.listContainer}>
        <List className={classes.list}>
          {listItems(filter)}
        </List>
      </div>
    </Paper>
  )
}

export default FeaturePalette

import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import List from '@material-ui/core/List'
import Search from './Search'
import descriptors from '../feature-descriptors'
import FeatureItem from './FeatureItem'
import Presets from './Presets'

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
  const [filter, setFilter] = React.useState('')
  const [preset, setPreset] = React.useState({
    installation: null,
    status: 'P',
    hostility: 'F'
  })

  const listItems = () => {
    if (!filter || filter.length < 3) return []
    return descriptors.featureDescriptors(filter, preset)
      .map(descriptor => <FeatureItem key={descriptor.sortkey} {...descriptor}/>)
  }

  const handleKeyDown = event => {
    switch (event.key) {
      case 'Escape': return setFilter('')
    }
  }

  return (
    <Paper
      className={classes.panel}
      elevation={6}
    >
      <div className={classes.buttons}>
        <Presets value={preset} onChange={setPreset}/>
      </div>
      <Search value={filter} onChange={setFilter}/>
      <div className={classes.listContainer}>
        <List
          className={classes.list}
          onKeyDown={handleKeyDown}
        >
          {listItems(filter)}
        </List>
      </div>
    </Paper>
  )
}

export default FeaturePalette

import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import Paper from '@material-ui/core/Paper'
import List from '@material-ui/core/List'
import Search from './Search'
import descriptors from '../feature-descriptors'
import FeatureItem from './FeatureItem'

const useStyles = makeStyles((/* theme */) => ({
  panel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    fontFamily: 'Roboto',
    display: 'flex',
    flexDirection: 'column'
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
  const match = filter => descriptor => descriptor.sortkey.includes(filter.toLowerCase())

  const listItems = filter => {
    if (!filter || filter.length < 3) return []
    const items = descriptors.featureDescriptors()
      .filter(match(filter))
      .map(descriptor => <FeatureItem key={descriptor.sortkey} {...descriptor}/>)

    // Longer lists are pretty slow to be rendered:
    return R.take(50, items)
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

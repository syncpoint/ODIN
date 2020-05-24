/* eslint-disable */
import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import List from '@material-ui/core/List'
import { Search } from './Search'
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

  const listItems = () => descriptors.featureDescriptors().map(descriptor => {
    return <FeatureItem key={descriptor.sortkey} {...descriptor}/>
  })

  return (
    <Paper
      className={classes.panel}
      elevation={6}
    >
      <Search/>
      <div className={classes.listContainer}>
        <List className={classes.list}>
          {listItems()}
        </List>
      </div>
    </Paper>
  )
}

export default FeaturePalette

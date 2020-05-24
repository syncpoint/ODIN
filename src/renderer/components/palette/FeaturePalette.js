import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'

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

  return (
    <Paper
      className={classes.panel}
      elevation={6}
    >
    </Paper>
  )
}

export default FeaturePalette

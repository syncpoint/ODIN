import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Paper, TextField } from '@material-ui/core'
import HostilityProperty from './HostilityProperty'
import TextProperty from './TextProperty'

const useStyles = makeStyles(theme => ({
  paper: {
    userSelect: 'none',
    padding: theme.spacing(4),
    height: 'auto',
    pointerEvents: 'auto',
    gridArea: 'R',

    display: 'grid',
    gridGap: '0.5em',
    gridTemplateColumns: 'auto auto',
    gridAutoRows: 'min-content'
  },

  twoColumns: { gridColumn: '1 / span 2' }
}))

const EEIProperties = props => {
  const classes = useStyles()

  return (
    <Paper
      className={classes.paper}
      elevation={4}
    >
      <TextField label='Name' className={classes.twoColumns}/>
      <TextProperty label='Unique Designation' property='t' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Quantity' property='c' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Speed' property='z' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Direction' property='q' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Staff Comments' property='g' className={classes.twoColumns} properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Additional Information' property='h' className={classes.twoColumns} properties={props.properties} onCommit={props.update}/>
      <HostilityProperty properties={props.properties} onCommit={props.update} className={classes.twoColumns}/>
    </Paper>
  )
}

EEIProperties.propTypes = {
  properties: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired
}

export default EEIProperties

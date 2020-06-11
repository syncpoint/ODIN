import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Paper } from '@material-ui/core'
import EchelonProperty from './EchelonProperty'
import ReinforcedReduced from './ReinforcedReduced'
import ModifierProperty from './ModifierProperty'
import HostilityProperty from './HostilityProperty'
import StatusGroupFull from './StatusGroupFull'
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

const UnitProperties = props => {
  const classes = useStyles()

  return (
    <Paper
      className={classes.paper}
      elevation={4}
    >
      <TextProperty label='Name' property='name' properties={props.properties} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label='Unique Designation' property='t' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Higher Formation' property='m' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Speed' property='z' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Direction' property='q' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Staff Comments' property='g' className={classes.twoColumns} properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Special C2 HQ' property='aa' className={classes.twoColumns} properties={props.properties} onCommit={props.update}/>
      <HostilityProperty properties={props.properties} onCommit={props.update}/>
      <EchelonProperty properties={props.properties} onCommit={props.update}/>
      <StatusGroupFull properties={props.properties} onCommit={props.update}/>
      <ModifierProperty properties={props.properties} onCommit={props.update}/>
      <ReinforcedReduced property='f' properties={props.properties} onCommit={props.update}/>
    </Paper>
  )
}

UnitProperties.propTypes = {
  properties: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired
}

export default UnitProperties

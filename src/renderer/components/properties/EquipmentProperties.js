import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Paper } from '@material-ui/core'
import HostilityProperty from './HostilityProperty'
import StatusGroupFull from './StatusGroupFull'
import TextProperty from './TextProperty'
import MobilityProperty from './MobilityProperty'

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

const EquipmentProperties = props => {
  const classes = useStyles()

  return (
    <Paper
      className={classes.paper}
      elevation={4}
    >
      <TextProperty label='Name' property='name' properties={props.properties} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label='Unique Designation' property='t' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Quantity' property='c' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Speed' property='z' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Direction' property='q' properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Type' property='v' properties={props.properties} onCommit={props.update} className={classes.twoColumns} />
      <TextProperty label='Staff Comments' property='g' className={classes.twoColumns} properties={props.properties} onCommit={props.update}/>
      <TextProperty label='Additional Information' property='h' className={classes.twoColumns} properties={props.properties} onCommit={props.update}/>
      <HostilityProperty properties={props.properties} onCommit={props.update}/>
      <MobilityProperty properties={props.properties} onCommit={props.update}/>
      <StatusGroupFull properties={props.properties} onCommit={props.update}/>
    </Paper>
  )
}

EquipmentProperties.propTypes = {
  properties: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired
}

export default EquipmentProperties

import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import HostilityProperty from './HostilityProperty'
import StatusGroupFull from './StatusGroupFull'
import TextProperty from './TextProperty'

/**
 * Same as Unit except without Reinforced/Reduced.
 */

const useStyles = makeStyles(theme => ({
  twoColumns: { gridColumn: '1 / span 2' }
}))

const StabilityOperationsProperties = props => {
  const classes = useStyles()

  return (
    <>
      <TextProperty label='Name' property='name' properties={props.getProperties()} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label='Unique Designation' property='t' properties={props.getProperties()} onCommit={props.update}/>
      <HostilityProperty properties={props.getProperties()} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label='Date-Time Group' property='w' className={classes.twoColumns} properties={props.getProperties()} onCommit={props.update}/>
      <TextProperty label='Speed' property='z' properties={props.getProperties()} onCommit={props.update}/>
      <TextProperty label='Direction' property='q' properties={props.getProperties()} onCommit={props.update}/>
      <TextProperty label='Staff Comments' property='g' className={classes.twoColumns} properties={props.getProperties()} onCommit={props.update}/>
      <TextProperty label='Additional Information' property='h' className={classes.twoColumns} properties={props.getProperties()} onCommit={props.update}/>
      <StatusGroupFull properties={props.getProperties()} onCommit={props.update}/>
    </>
  )
}

StabilityOperationsProperties.propTypes = {
  getProperties: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}

export default StabilityOperationsProperties

import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import HostilityProperty from './HostilityProperty'
import TextProperty from './TextProperty'

const useStyles = makeStyles(theme => ({
  twoColumns: { gridColumn: '1 / span 2' }
}))

const EEIProperties = props => {
  const classes = useStyles()
  const properties = props.getProperties()

  return (
    <>
      <TextProperty label='Name' property='name' properties={properties} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label='Unique Designation' property='t' properties={properties} onCommit={props.update}/>
      <TextProperty label='Quantity' property='c' properties={properties} onCommit={props.update}/>
      <HostilityProperty properties={properties} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label='Date-Time Group' property='w' className={classes.twoColumns} properties={properties} onCommit={props.update}/>
      <TextProperty label='Speed' property='z' properties={properties} onCommit={props.update}/>
      <TextProperty label='Direction' property='q' properties={properties} onCommit={props.update}/>
      <TextProperty label='Staff Comments' property='g' className={classes.twoColumns} properties={properties} onCommit={props.update}/>
      <TextProperty label='Additional Information' property='h' className={classes.twoColumns} properties={properties} onCommit={props.update}/>
    </>
  )
}

EEIProperties.propTypes = {
  getProperties: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}

export default EEIProperties

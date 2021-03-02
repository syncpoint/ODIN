import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import TextProperty from './TextProperty'
import HostilityProperty from './HostilityProperty'

const useStyles = makeStyles(theme => ({
  twoColumns: { gridColumn: '1 / span 2' }
}))

const PointProperties = props => {
  const classes = useStyles()

  return (
    <>
      <TextProperty label='Name' property='name' properties={props.getProperties()} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label={'Unique Designation'} property={'t'} properties={props.getProperties()} onCommit={props.update} className={ classes.twoColumns } />
      <HostilityProperty properties={props.getProperties()} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label='Date-Time Group' property='w' className={classes.twoColumns} properties={props.getProperties()} onCommit={props.update}/>
      <TextProperty label='Staff Comments' property='g' className={classes.twoColumns} properties={props.getProperties()} onCommit={props.update}/>
      <TextProperty label={'Additional Information'} property={'h'} properties={props.getProperties()} onCommit={props.update} className={ classes.twoColumns }/>
      <TextProperty label={'Altitude/Depth'} property={'x'} properties={props.getProperties()} onCommit={props.update} className={ classes.twoColumns }/>
      {/* TODO: ENY property */}
    </>
  )
}

PointProperties.propTypes = {
  getProperties: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}


export default PointProperties

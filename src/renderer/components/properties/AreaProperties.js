import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import EchelonProperty from './EchelonProperty'
import HostilityProperty from './HostilityProperty'
import StatusGroupReduced from './StatusGroupReduced'
import TextProperty from './TextProperty'

const useStyles = makeStyles(theme => ({
  twoColumns: { gridColumn: '1 / span 2' }
}))

const AreaProperties = props => {
  const classes = useStyles()

  return (
    <>
      <TextProperty label='Name' property='name' properties={props.getProperties()} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label={'Unique Designation'} property={'t'} properties={props.getProperties()} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Additional Information'} property={'h'} properties={props.getProperties()} onCommit={props.update} className={ classes.twoColumns }/>
      <HostilityProperty properties={props.getProperties()} onCommit={props.update}/>
      <EchelonProperty properties={props.getProperties()} onCommit={props.update}/>
      <StatusGroupReduced properties={props.getProperties()} onCommit={props.update}/>
      <TextProperty label={'Effective (from)'} property={'w'} properties={props.getProperties()} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Effective (to)'} property={'w1'} properties={props.getProperties()} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Altitude (from)'} property={'x'} properties={props.getProperties()} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Altitude (to)'} property={'x1'} properties={props.getProperties()} onCommit={props.update} className={ classes.twoColumns } />
      {/* TODO: ENY property */}
    </>
  )
}

AreaProperties.propTypes = {
  getProperties: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}


export default AreaProperties

import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Slider from '@material-ui/core/Slider'
import Typography from '@material-ui/core/Typography'
import throttle from 'lodash.throttle'

import EchelonProperty from './EchelonProperty'
import HostilityProperty from './HostilityProperty'
import StatusGroupReduced from './StatusGroupReduced'
import TextProperty from './TextProperty'

const useStyles = makeStyles(theme => ({
  twoColumns: { gridColumn: '1 / span 2' }
}))

const LineProperties = props => {
  const properties = props.getProperties()
  const classes = useStyles()
  const [echelonOffset, setEchelonOffset] = React.useState(properties.echelonOffset || 0.5)

  const handleChange = throttle((_, newValue) => {
    properties.echelonOffset = newValue
    setEchelonOffset(properties.echelonOffset)
    props.update({ echelonOffset: properties.echelonOffset })
  }, 75)

  return (
    <>
      <TextProperty label='Name' property='name' properties={properties} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label={'Unique Designation (Left)'} property={'t'} properties={properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Unique Designation (Right)'} property={'t1'} properties={properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Additional Information'} property={'h'} properties={properties} onCommit={props.update} className={ classes.twoColumns }/>
      <HostilityProperty properties={properties} onCommit={props.update}/>
      <EchelonProperty properties={properties} onCommit={props.update}/>
      <Typography component='div'>Label Placement</Typography>
      <Slider value={echelonOffset} min={0} max={1} step={0.01} onChange={handleChange} color={'secondary'} className={ classes.twoColumns }/>
      <StatusGroupReduced properties={properties} onCommit={props.update}/>
      <TextProperty label={'Effective (from)'} property={'w'} properties={properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Effective (to)'} property={'w1'} properties={properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Altitude (from)'} property={'x'} properties={properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Altitude (to)'} property={'x1'} properties={properties} onCommit={props.update} className={ classes.twoColumns } />
      {/* TODO: ENY property */}
    </>
  )
}

LineProperties.propTypes = {
  getProperties: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}


export default LineProperties

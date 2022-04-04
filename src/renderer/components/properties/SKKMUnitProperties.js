import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import EchelonProperty from './EchelonProperty'
import TextProperty from './TextProperty'
import SKKMModifierProperty from './SKKMModifierProperty'

const useStyles = makeStyles((/* theme */) => ({
  twoColumns: { gridColumn: '1 / span 2' }
}))

const SKKMUnitProperties = props => {
  const classes = useStyles()
  const properties = props.getProperties()

  return (
    <>
      <TextProperty label='Name' property='name' properties={properties} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label='Unique Designation' property='t' properties={properties} onCommit={props.update}/>
      <TextProperty label='Higher Formation' property='m' properties={properties} onCommit={props.update}/>
      <TextProperty label='Text in Symbol' property='aa' properties={properties} onCommit={props.update}/>
      <EchelonProperty properties={properties} onCommit={props.update}/>
      <TextProperty label='Date-Time Group' property='w' className={classes.twoColumns} properties={properties} onCommit={props.update}/>
      <TextProperty label='Speed' property='z' properties={properties} onCommit={props.update}/>
      <TextProperty label='Direction' property='q' properties={properties} onCommit={props.update}/>
      <TextProperty label='Additional Information' property='h' className={classes.twoColumns} properties={properties} onCommit={props.update}/>
      <SKKMModifierProperty properties={properties} onCommit={props.update}/>
    </>
  )
}

SKKMUnitProperties.propTypes = {
  getProperties: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}

export default SKKMUnitProperties

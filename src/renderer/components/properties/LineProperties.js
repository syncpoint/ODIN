import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Paper } from '@material-ui/core'
import EchelonProperty from './EchelonProperty'
import HostilityProperty from './HostilityProperty'
import StatusGroupReduced from './StatusGroupReduced'
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

const LineProperties = props => {
  const classes = useStyles()

  return (
    <Paper
      className={ classes.paper }
      elevation={ 4 }
    >
      <TextProperty label='Name' property='name' properties={props.properties} onCommit={props.update} className={classes.twoColumns}/>
      <TextProperty label={'Unique Designation'} property={'t'} properties={props.properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty property={'t1'} properties={props.properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Additional Information'} property={'h'} properties={props.properties} onCommit={props.update} className={ classes.twoColumns }/>
      <HostilityProperty properties={props.properties} onCommit={props.update}/>
      <EchelonProperty properties={props.properties} onCommit={props.update}/>
      <StatusGroupReduced properties={props.properties} onCommit={props.update}/>
      <TextProperty label={'Effective (from)'} property={'w'} properties={props.properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Effective (to)'} property={'w1'} properties={props.properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Altitude (from)'} property={'x'} properties={props.properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Altitude (to)'} property={'x1'} properties={props.properties} onCommit={props.update} className={ classes.twoColumns } />
      {/* TODO: ENY property */}
    </Paper>
  )
}

LineProperties.propTypes = {
  properties: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired
}


export default LineProperties

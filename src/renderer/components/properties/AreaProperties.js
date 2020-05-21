import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Paper, TextField } from '@material-ui/core'
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

  fullwidth: { gridColumn: '1 / span 2' }
}))

const AreaProperties = props => {
  const classes = useStyles()
  const handleCommit = feature => props.updateFeature(feature)

  return (
    <Paper
      className={ classes.paper }
      elevation={ 4 }
    >
      <TextField label={'Name'} className={ classes.fullwidth } />
      <TextProperty label={'Unique Designation'} property={'t'} feature={props.feature} onCommit={handleCommit} className={ classes.fullwidth } />
      <TextProperty label={'Additional Information'} property={'h'} feature={props.feature} onCommit={handleCommit} className={ classes.fullwidth }/>
      <HostilityProperty feature={props.feature} onCommit={handleCommit}/>
      <EchelonProperty feature={props.feature} onCommit={handleCommit}/>
      <StatusGroupReduced feature={props.feature} onCommit={handleCommit}/>
      <TextProperty label={'Effective (from)'} property={'w'} feature={props.feature} onCommit={handleCommit} className={ classes.fullwidth } />
      <TextProperty label={'Effective (to)'} property={'w1'} feature={props.feature} onCommit={handleCommit} className={ classes.fullwidth } />
      <TextProperty label={'Altitude (from)'} property={'x'} feature={props.feature} onCommit={handleCommit} className={ classes.fullwidth } />
      <TextProperty label={'Altitude (to)'} property={'x1'} feature={props.feature} onCommit={handleCommit} className={ classes.fullwidth } />
    </Paper>
  )
}

AreaProperties.propTypes = {
  feature: PropTypes.object.isRequired,
  updateFeature: PropTypes.func.isRequired
}


export default AreaProperties

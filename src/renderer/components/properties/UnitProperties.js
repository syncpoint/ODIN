import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Paper, TextField } from '@material-ui/core'
import EchelonProperty from './EchelonProperty'
import ReinforcedReduced from './ReinforcedReduced'
import Modifier from './Modifier'
import HostilityProperty from './HostilityProperty'
import StatusGroup from './StatusGroup'
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

const UnitProperties = props => {
  const classes = useStyles()
  const handleCommit = feature => props.updateFeature(feature)

  return (
    <Paper
      className={ classes.paper }
      elevation={ 4 }
    >
      <TextField label={'Name'} className={ classes.fullwidth } />
      <TextProperty label={'Unique Designation'} property={'t'} feature={props.feature} onCommit={handleCommit} />
      <TextProperty label={'Higher Formation'} property={'m'} feature={props.feature} onCommit={handleCommit} />
      <TextProperty label={'Speed'} property={'z'} feature={props.feature} onCommit={handleCommit} />
      <TextProperty label={'Direction'} property={'q'} feature={props.feature} onCommit={handleCommit} />
      <TextProperty label={'Staff Comments'} property={'g'} feature={props.feature} onCommit={handleCommit} />
      <TextProperty label={'Special C2 HQ'} property={'aa'} feature={props.feature} onCommit={handleCommit} />
      <HostilityProperty feature={props.feature} onCommit={handleCommit}/>
      <EchelonProperty feature={props.feature} onCommit={handleCommit}/>
      <StatusGroup feature={props.feature} onCommit={handleCommit}/>
      <Modifier/>
      <ReinforcedReduced/>
    </Paper>
  )
}

UnitProperties.propTypes = {
  feature: PropTypes.object.isRequired,
  updateFeature: PropTypes.func.isRequired
}


export default UnitProperties


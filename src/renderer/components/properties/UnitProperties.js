import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Paper, TextField } from '@material-ui/core'
import { SelectEchelon } from './SelectEchelon'
import ReinforcedReduced from './ReinforcedReduced'
import Modifier from './Modifier'
import Hostility from './Hostility'
import Status from './Status'

const useStyles = makeStyles(theme => ({
  paper: {
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

  return (
    <Paper
      className={ classes.paper }
      elevation={ 4 }
    >
      <TextField label={'Name'} className={ classes.fullwidth } />
      <TextField label={'Unique Designation'} />
      <TextField label={'Higher Formation'} />
      <TextField label={'Speed'} />
      <TextField label={'Direction'} />
      <TextField label={'Staff Comments'} className={ classes.fullwidth } />
      <TextField label={'Special C2 HQ'} className={ classes.fullwidth } />
      <Hostility/>
      <SelectEchelon label={'Echelon'} />
      <Status/>
      <Modifier/>
      <ReinforcedReduced/>
    </Paper>
  )
}


export default UnitProperties


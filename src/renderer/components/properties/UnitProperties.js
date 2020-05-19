import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Paper, TextField } from '@material-ui/core'
import { SelectEchelon } from './SelectEchelon'
import ReinforcedReduced from './ReinforcedReduced'
import Modifier from './Modifier'
import Hostility from './Hostility'
import Status from './Status'

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
  const [feature, setFeature] = React.useState(props.feature)

  return (
    <Paper
      className={ classes.paper }
      elevation={ 4 }
    >
      <TextField label={'Name'} className={ classes.fullwidth } />

      {/*
        TODO: hold temporary value
        TODO: handle 'ESCAPE': reset to original value
        TODO: handle 'ENTER': update feature
        TODO: trim value
       */}

      <TextField
        label={'Unique Designation'}
        value={feature.t}
        onChange={({ target }) => setFeature({ ...feature, t: target.value })}
        onBlur={() => props.updateFeature(feature)}
      />

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

UnitProperties.propTypes = {
  feature: PropTypes.object.isRequired,
  updateFeature: PropTypes.func.isRequired
}


export default UnitProperties


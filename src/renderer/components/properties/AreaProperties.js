import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Paper, TextField } from '@material-ui/core'
import { SelectEchelon } from './SelectEchelon'
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

const AreaProperties = props => {
  const classes = useStyles()
  const [feature, setFeature] = React.useState(props.feature)

  return (
    <Paper
      className={ classes.paper }
      elevation={ 4 }
    >
      <TextField label={'Name'} className={ classes.fullwidth } />

      <TextField
        label={'Unique Designation'}
        value={feature.t}
        onChange={({ target }) => setFeature({ ...feature, t: target.value })}
        onBlur={() => props.updateFeature(feature)}
      />

      <TextField label={'Additional Information'} className={ classes.fullwidth } />
      <Hostility />
      <SelectEchelon label={'Echelon'} />
      <Status/>
      <TextField className={ classes.fullwidth } label={'Effective (from)'} />
      <TextField className={ classes.fullwidth } label={'Effective (to)'} />
      <TextField label={'Altitude (from)'} />
      <TextField label={'Altitude (to)'} />
    </Paper>
  )
}

AreaProperties.propTypes = {
  feature: PropTypes.object.isRequired,
  updateFeature: PropTypes.func.isRequired
}


export default AreaProperties

import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Paper, TextField } from '@material-ui/core'
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

const PointProperties = props => {
  const classes = useStyles()

  return (
    <Paper
      className={ classes.paper }
      elevation={ 4 }
    >
      <TextField label={'Name'} className={ classes.twoColumns } />
      <TextProperty label={'Unique Designation'} property={'t'} properties={props.properties} onCommit={props.update} className={ classes.twoColumns } />
      <TextProperty label={'Additional Information'} property={'h'} properties={props.properties} onCommit={props.update} className={ classes.twoColumns }/>
      {/* TODO: ENY property */}
    </Paper>
  )
}

PointProperties.propTypes = {
  properties: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired
}


export default PointProperties

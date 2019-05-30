import React from 'react'
import { Paper, Typography } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'

const Properties = props =>
  <Paper
    className={ props.classes.paper }
    elevation={ 4 }
  >
    <Typography variant="h5" component="h3">
      { props.options.id }
    </Typography>
  </Paper>


const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 4,
    height: 'auto',
    pointerEvents: 'auto',
    gridArea: 'R',
    background: 'rgba(252, 252, 255, 0.9)'
  }
})

Properties.propTypes = {
  classes: PropTypes.any.isRequired,
  options: PropTypes.any.isRequired
}

export default withStyles(styles)(Properties)

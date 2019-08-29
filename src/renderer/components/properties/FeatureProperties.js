/* eslint-disable */
import React from 'react'
import { Paper, TextField } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import layerStore from '../../stores/layer-store'

class FeatureProperties extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  render () {
    return (
      <Paper
        className={ this.props.classes.paper }
        elevation={ 4 }
      >
      </Paper>
    )
  }
}

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 4,
    height: 'auto',
    pointerEvents: 'auto',
    gridArea: 'R',
    background: 'rgba(252, 252, 255, 0.9)',

    display: 'grid',
    gridGap: '2em',
    gridTemplateColumns: 'auto',
    gridAutoRows: 'min-content'
  }
})

FeatureProperties.propTypes = {
  classes: PropTypes.any.isRequired,
}

export default withStyles(styles)(FeatureProperties)
